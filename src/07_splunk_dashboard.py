import streamlit as st
import pandas as pd
import networkx as nx
from pyvis.network import Network
import os

DATA_DIR = 'data'

# Must be the first Streamlit command
st.set_page_config(layout="wide", page_title="Splunk - Insider Threat SIEM", page_icon="🛡️")

# Splunk-like Custom CSS for exact styling overrides
st.markdown("""
<style>
    /* Splunk SIEM header style */
    .splunk-header {
        background-color: #1e2023;
        border-bottom: 2px solid #65A637;
        padding: 15px;
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .splunk-logo {
        color: #65A637;
        font-size: 28px;
        font-weight: bold;
        font-family: sans-serif;
    }
    .splunk-subtitle {
        color: #eeeeee;
        font-size: 16px;
    }
    /* Panel styling to mimic Splunk panels */
    .st-emotion-cache-1y4p8pa {
        background-color: #292c31;
        border-radius: 4px;
        padding: 10px;
    }
</style>
<div class="splunk-header">
    <div class="splunk-logo">&gt;_ Splunk Enterprise Security</div>
    <div class="splunk-subtitle">Insider Threat Detection Module</div>
</div>
""", unsafe_allow_html=True)

# Load data
@st.cache_data
def load_all_data():
    features = pd.read_csv(os.path.join(DATA_DIR, 'merged_features.csv'))
    scores = pd.read_csv(os.path.join(DATA_DIR, 'anomaly_scores.csv'))
    file_access = pd.read_csv(os.path.join(DATA_DIR, 'file_access.csv'), parse_dates=['access_time'])
    usb_usage = pd.read_csv(os.path.join(DATA_DIR, 'usb_usage.csv'), parse_dates=['plug_time', 'unplug_time'])
    return features, scores, file_access, usb_usage

try:
    features, scores, file_access, usb_usage = load_all_data()
    df = pd.merge(features, scores, on='user')
except FileNotFoundError:
    st.error("Data files not found. Please run the data generation and modeling scripts first.")
    st.stop()

# Prepare node attributes for graph
def get_node_attrs():
    attrs = {}
    for _, row in scores.iterrows():
        anomaly = max(row['isolation_forest'], row['oneclass_svm'], row['autoencoder'])
        red_team = row['is_red_team']
        attrs[row['user']] = {
            'anomaly': anomaly,
            'red_team': red_team,
            'high_risk': (anomaly > 1.0) or (red_team == 1)
        }
    return attrs
attrs = get_node_attrs()

# Build full graph
def build_graph():
    G = nx.Graph()
    for _, row in file_access.iterrows():
        G.add_edge(row['user'], row['file'], type='access')
    for _, row in usb_usage.iterrows():
        G.add_edge(row['user'], row['device'], type='usb')
    return G
G = build_graph()

# At-risk subgraph
def get_at_risk_subgraph(G, attrs):
    high_risk_nodes = {n for n, v in attrs.items() if v['high_risk']}
    connected_nodes = set()
    for node in high_risk_nodes:
        connected_nodes.add(node)
        connected_nodes.update(G.neighbors(node))
    return G.subgraph(connected_nodes).copy()

# Sidebar (Splunk Search / Filters)
with st.sidebar:
    st.markdown("<h2 style='color: #65A637;'>Filters</h2>", unsafe_allow_html=True)
    score_method = st.selectbox('Anomaly Detection Model', ['isolation_forest', 'oneclass_svm', 'autoencoder'])
    min_score = st.slider('Minimum Anomaly Score', -5.0, 5.0, 0.0)

# Apply filters
df['Red Team'] = df['is_red_team_x'].apply(lambda x: '🚩' if x == 1 else '') if 'is_red_team_x' in df.columns else df['is_red_team'].apply(lambda x: '🚩' if x == 1 else '')
df_filtered = df[df[score_method] >= min_score]
df_filtered['rank'] = df_filtered[score_method].rank(ascending=False)
df_sorted = df_filtered.sort_values(score_method, ascending=False)

# Top metrics (Splunk style)
col1, col2, col3, col4 = st.columns(4)
col1.metric("Total Events Logged", len(file_access) + len(usb_usage))
col2.metric("Active Users", len(df))
col3.metric("Anomalies Detected", len(df_sorted[df_sorted[score_method] > 1.5]))
col4.metric("Red Team Flags", df['is_red_team'].sum() if 'is_red_team' in df.columns else 0)

st.markdown("---")

# Tabs
anomaly_tab, user_tab, graph_tab, how_tab = st.tabs(["Search & Reporting", "Entity Profile", "Graph Investigation", "System Architecture"])

with anomaly_tab:
    st.markdown(f"### Events: {score_method} sorted by risk")
    cols = ['user', 'Red Team', score_method, 'rank'] + [c for c in df.columns if c not in ['user', score_method, 'rank', 'Red Team']]
    
    # Render dataframe to look somewhat like Splunk logs
    st.dataframe(df_sorted[cols], height=400, use_container_width=True)
    
    st.markdown("### Top 5 Anomalous Entities")
    top5 = df_sorted.head(5)
    st.bar_chart(top5.set_index('user')[score_method], color="#65A637")

with user_tab:
    st.markdown("### User Profiling / Incident Investigation")
    selected_user = st.selectbox('Target Entity', df_sorted['user'].tolist(), key='user_detail')
    if selected_user:
        user_row = df_sorted[df_sorted['user'] == selected_user].iloc[0]
        
        st.markdown(f"#### Entity: `{selected_user}`")
        if user_row['Red Team']:
            st.error("🚨 RED TEAM INJECTION DETECTED")
        
        scol1, scol2 = st.columns(2)
        with scol1:
            st.info("**Behavioral Features**")
            st.json({k: user_row[k] for k in ['mean_login_hour', 'mean_logout_hour', 'files_per_day', 'usb_per_day', 'emails_per_day', 'out_of_session_access'] if k in user_row})
        
        with scol2:
            st.warning("**Graph & NLP Features**")
            st.json({k: user_row[k] for k in ['degree_centrality', 'betweenness_centrality', 'keyword_flag', 'subject_len', 'sentiment'] if k in user_row})
            st.success("**Anomaly Scores**")
            st.json({k: user_row[k] for k in ['isolation_forest', 'oneclass_svm', 'autoencoder']})

with graph_tab:
    st.markdown("### Link Analysis Workspace")
    subG = get_at_risk_subgraph(G, attrs)
    net = Network(height='700px', width='100%', notebook=False, bgcolor='#1e2023', font_color='#eeeeee')
    net.barnes_hut(gravity=-2000, central_gravity=0.1, spring_length=200, spring_strength=0.01, damping=0.85, overlap=1)
    
    net.set_options('''
    var options = {
      "physics": {
        "enabled": true,
        "stabilization": {"enabled": true, "fit": true, "iterations": 1000, "updateInterval": 50},
        "barnesHut": {
          "gravitationalConstant": -2000,
          "centralGravity": 0.1,
          "springLength": 200,
          "springConstant": 0.01,
          "damping": 0.85,
          "avoidOverlap": 1
        }
      }
    }
    ''')
    for node in subG.nodes():
        if node in attrs:
            score = attrs[node]['anomaly']
            red = attrs[node]['red_team']
            color = '#ff3333' if red else ('#ff9900' if score > 1.5 else '#65A637' if score <= 1.0 else '#ffff66')
            size = 30 if red else (20 if score > 1.5 else 15 if score > 1.0 else 10)
            title = f"User: {node}<br>Risk: {score:.2f}<br>Red Team: {'Yes' if red else 'No'}"
        elif str(node).startswith('file'):
            color = '#428bca'
            size = 8
            title = f"File: {node}"
        elif str(node).startswith('usb'):
            color = '#9933cc'
            size = 8
            title = f"Device: {node}"
        else:
            color = '#777777'
            size = 8
            title = str(node)
        net.add_node(node, label=str(node), color=color, size=size, title=title)
    for edge in subG.edges(data=True):
        net.add_edge(edge[0], edge[1], color='#444444' if edge[2]['type']=='access' else '#9933cc')
    
    graph_path = os.path.join(DATA_DIR, 'graph.html')
    net.save_graph(graph_path)
    st.components.v1.html(open(graph_path, 'r', encoding='utf-8').read(), height=750, scrolling=False)

with how_tab:
    st.markdown("### System Architecture")
    st.markdown('''
This system detects insider threats by analyzing user behavior, system access, and relationships using advanced machine learning and graph analysis techniques.

---

### 1. **Data Simulation & Feature Engineering**
- **Simulated Logs:** The system generates synthetic logs for user logins, file access, USB usage, and emails, mimicking real organizational activity.
- **Feature Engineering:** Extracts features such as:
    - Login/logout patterns (mean hours, frequency)
    - File/USB/email activity rates
    - Out-of-session file access
    - Graph centrality (degree, betweenness)
    - NLP features from email subjects (keyword flags, length)

### 2. **Anomaly Detection Algorithms**
- **Isolation Forest:** Randomly partitions data to isolate points. Anomalies are isolated faster (shorter average path length in trees).
- **One-Class SVM:** Finds a boundary in feature space that encloses most data (support vectors). Points outside are anomalies.
- **Autoencoder:** Neural network learns to compress and reconstruct input. High reconstruction error indicates anomaly.

### 3. **Graph Analysis**
- **Entity Graph:** Users, files, and devices are nodes; edges represent access or usage.
- **Centrality Measures:**
    - *Degree Centrality:* Number of connections (activity level).
    - *Betweenness Centrality:* Frequency a node lies on shortest paths (potential for information flow/control).
- **At-Risk Subgraph:** Focuses on high-risk users and their direct connections for visualization and investigation.
''')