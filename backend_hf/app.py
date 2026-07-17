import gradio as gr
from src.api_server import (
    get_dashboard_state, get_users, get_events, get_policies, get_sessions,
    user_action, add_policy, toggle_policy, delete_policy, kill_session, user_behavior,
    UserAction, NewPolicy, PolicyToggle
)

# Wrappers for POST requests to match Gradio's positional arguments
def wrap_user_action(uid, action, reason):
    return user_action(uid, UserAction(action=action, reason=reason))

def wrap_add_policy(name, category, scope, enforcement):
    return add_policy(NewPolicy(name=name, category=category, scope=scope, enforcement=enforcement))

def wrap_toggle_policy(pid, enabled):
    return toggle_policy(pid, PolicyToggle(enabled=enabled))

def wrap_delete_policy(pid):
    return delete_policy(pid)

def wrap_kill_session(agent_id):
    return kill_session(agent_id)

with gr.Blocks(title="Vortex SIEM Backend") as demo:
    gr.Markdown("# Vortex SIEM Backend (Gradio API)")
    gr.Markdown("This space hosts the SIEM backend via Gradio API endpoints for Hugging Face compatibility.")
    
    # Define hidden buttons to expose API endpoints
    with gr.Row(visible=False):
        btn_dash = gr.Button("Dashboard")
        btn_dash.click(fn=get_dashboard_state, inputs=[], outputs=[gr.JSON()], api_name="get_dashboard_state")
        
        btn_users = gr.Button("Users")
        btn_users.click(fn=get_users, inputs=[], outputs=[gr.JSON()], api_name="get_users")
        
        btn_events = gr.Button("Events")
        btn_events.click(fn=get_events, inputs=[], outputs=[gr.JSON()], api_name="get_events")
        
        btn_policies = gr.Button("Policies")
        btn_policies.click(fn=get_policies, inputs=[], outputs=[gr.JSON()], api_name="get_policies")
        
        btn_sessions = gr.Button("Sessions")
        btn_sessions.click(fn=get_sessions, inputs=[], outputs=[gr.JSON()], api_name="get_sessions")
        
        btn_beh = gr.Button("Behavior")
        beh_uid = gr.Textbox()
        btn_beh.click(fn=user_behavior, inputs=[beh_uid], outputs=[gr.JSON()], api_name="user_behavior")
        
        btn_ua = gr.Button("User Action")
        ua_uid = gr.Textbox()
        ua_act = gr.Textbox()
        ua_rsn = gr.Textbox()
        btn_ua.click(fn=wrap_user_action, inputs=[ua_uid, ua_act, ua_rsn], outputs=[gr.JSON()], api_name="user_action")
        
        btn_ap = gr.Button("Add Policy")
        ap_n = gr.Textbox()
        ap_c = gr.Textbox()
        ap_s = gr.Textbox()
        ap_e = gr.Textbox()
        btn_ap.click(fn=wrap_add_policy, inputs=[ap_n, ap_c, ap_s, ap_e], outputs=[gr.JSON()], api_name="add_policy")
        
        btn_tp = gr.Button("Toggle Policy")
        tp_pid = gr.Textbox()
        tp_en = gr.Checkbox()
        btn_tp.click(fn=wrap_toggle_policy, inputs=[tp_pid, tp_en], outputs=[gr.JSON()], api_name="toggle_policy")
        
        btn_dp = gr.Button("Delete Policy")
        dp_pid = gr.Textbox()
        btn_dp.click(fn=wrap_delete_policy, inputs=[dp_pid], outputs=[gr.JSON()], api_name="delete_policy")
        
        btn_ks = gr.Button("Kill Session")
        ks_aid = gr.Textbox()
        btn_ks.click(fn=wrap_kill_session, inputs=[ks_aid], outputs=[gr.JSON()], api_name="kill_session")

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860)

