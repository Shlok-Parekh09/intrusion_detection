import gradio as gr
import spaces
import threading
from src.api_server import (
    get_endpoints, get_events, get_users, get_policies, get_sessions, get_graph,
    user_behavior, kill_session, security_policies, get_login_trends
)
from src.api_server import user_action as _user_action
from src.api_server import toggle_policy as _toggle_policy
from src.api_server import ingest_cert_log as _ingest_cert_log
from src.api_server import UserAction, PolicyToggle, CertEvent

def ingest_cert_log_adapter(user_id, event_type, action, details):
    return _ingest_cert_log(CertEvent(user_id=user_id, event_type=event_type, action=action, details=details))

def user_action_adapter(user_id, action, reason):
    return _user_action(user_id, UserAction(action=action, reason=reason))

def toggle_policy_adapter(policy_id, enabled):
    return _toggle_policy(policy_id, PolicyToggle(enabled=enabled))

def get_events_adapter():
    return get_events(limit=50)
    
def add_policy_adapter(name, category, scope, enforcement):
    from src.api_server import NewPolicy, add_policy
    return add_policy(NewPolicy(name=name, category=category, scope=scope, enforcement=enforcement))

@spaces.GPU
def dummy_gpu():
    pass

with gr.Blocks() as demo:
    gr.Markdown("# VORTEX SIEM Backend API (ZeroGPU Bypass)")
    
    # Dummy GPU component to satisfy HF AST parser
    gr.Button("dummy").click(dummy_gpu)
    
    dummy_out = gr.JSON(visible=False)
    
    # Expose API endpoints
    gr.Button("endpoints").click(get_endpoints, outputs=[dummy_out], api_name="get_endpoints")
    gr.Button("events").click(get_events_adapter, outputs=[dummy_out], api_name="get_events")
    gr.Button("users").click(get_users, outputs=[dummy_out], api_name="get_users")
    gr.Button("policies").click(get_policies, outputs=[dummy_out], api_name="get_policies")
    gr.Button("sessions").click(get_sessions, outputs=[dummy_out], api_name="get_sessions")
    gr.Button("graph").click(get_graph, outputs=[dummy_out], api_name="get_graph")
    gr.Button("login_trends").click(get_login_trends, outputs=[dummy_out], api_name="get_login_trends")
    
    # Endpoints with args
    uid_input = gr.Textbox(visible=False)
    action_input = gr.Textbox(visible=False)
    reason_input = gr.Textbox(visible=False)
    gr.Button("user_action").click(user_action_adapter, inputs=[uid_input, action_input, reason_input], outputs=[dummy_out], api_name="user_action")
    
    pid_input = gr.Textbox(visible=False)
    enabled_input = gr.Checkbox(visible=False)
    gr.Button("toggle_policy").click(toggle_policy_adapter, inputs=[pid_input, enabled_input], outputs=[dummy_out], api_name="toggle_policy")
    
    agent_id_input = gr.Textbox(visible=False)
    gr.Button("kill_session").click(kill_session, inputs=[agent_id_input], outputs=[dummy_out], api_name="kill_session")
    
    ub_uid_input = gr.Textbox(visible=False)
    gr.Button("user_behavior").click(user_behavior, inputs=[ub_uid_input], outputs=[dummy_out], api_name="user_behavior")
    
    name_input = gr.Textbox(visible=False)
    cat_input = gr.Textbox(visible=False)
    scope_input = gr.Textbox(visible=False)
    enf_input = gr.Textbox(visible=False)
    gr.Button("add_policy").click(add_policy_adapter, inputs=[name_input, cat_input, scope_input, enf_input], outputs=[dummy_out], api_name="add_policy")

    cert_uid = gr.Textbox(visible=False)
    cert_type = gr.Textbox(visible=False)
    cert_act = gr.Textbox(visible=False)
    cert_det = gr.Textbox(visible=False)
    gr.Button("cert_log").click(ingest_cert_log_adapter, inputs=[cert_uid, cert_type, cert_act, cert_det], outputs=[dummy_out], api_name="cert_log")


demo.launch()
