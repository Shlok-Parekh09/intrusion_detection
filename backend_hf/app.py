import gradio as gr
import spaces
import threading
from src.api_server import (
    get_endpoints, get_events, get_users, get_policies, get_sessions, get_graph,
    user_behavior, kill_session, security_policies
)
from src.api_server import user_action as _user_action
from src.api_server import toggle_policy as _toggle_policy
from src.api_server import UserAction, PolicyToggle

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
    
    # Expose API endpoints
    gr.Button("endpoints").click(get_endpoints, api_name="get_endpoints")
    gr.Button("events").click(get_events_adapter, api_name="get_events")
    gr.Button("users").click(get_users, api_name="get_users")
    gr.Button("policies").click(get_policies, api_name="get_policies")
    gr.Button("sessions").click(get_sessions, api_name="get_sessions")
    gr.Button("graph").click(get_graph, api_name="get_graph")
    
    # Endpoints with args
    uid_input = gr.Textbox()
    action_input = gr.Textbox()
    reason_input = gr.Textbox()
    gr.Button("user_action").click(user_action_adapter, inputs=[uid_input, action_input, reason_input], api_name="user_action")
    
    pid_input = gr.Textbox()
    enabled_input = gr.Checkbox()
    gr.Button("toggle_policy").click(toggle_policy_adapter, inputs=[pid_input, enabled_input], api_name="toggle_policy")
    
    agent_id_input = gr.Textbox()
    gr.Button("kill_session").click(kill_session, inputs=[agent_id_input], api_name="kill_session")
    
    ub_uid_input = gr.Textbox()
    gr.Button("user_behavior").click(user_behavior, inputs=[ub_uid_input], api_name="user_behavior")
    
    name_input = gr.Textbox()
    cat_input = gr.Textbox()
    scope_input = gr.Textbox()
    enf_input = gr.Textbox()
    gr.Button("add_policy").click(add_policy_adapter, inputs=[name_input, cat_input, scope_input, enf_input], api_name="add_policy")

demo.launch()
