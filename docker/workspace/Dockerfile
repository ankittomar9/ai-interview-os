# M9 — Locked-down VS Code (code-server) for LLD Assessment Workspace
FROM codercom/code-server:4.96.2

USER root

# 1. Install jq to patch product.json and curl for healthchecks
RUN apt-get update && \
    apt-get install -y --no-install-recommends jq curl ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 2. Disable Extension Marketplace completely (no browse/install)
RUN if [ -f /usr/lib/code-server/lib/vscode/product.json ]; then \
        jq '.extensionsGallery = {"serviceUrl":"","itemUrl":"","controlUrl":""}' /usr/lib/code-server/lib/vscode/product.json > /tmp/product.json && \
        mv /tmp/product.json /usr/lib/code-server/lib/vscode/product.json; \
    fi && \
    if [ -f /usr/lib/code-server/product.json ]; then \
        jq '.extensionsGallery = {"serviceUrl":"","itemUrl":"","controlUrl":""}' /usr/lib/code-server/product.json > /tmp/product.json && \
        mv /tmp/product.json /usr/lib/code-server/product.json; \
    fi

# 3. Create default project workspace directory
RUN mkdir -p /home/coder/project && \
    mkdir -p /home/coder/.local/share/code-server/User && \
    mkdir -p /home/coder/.config/code-server && \
    chown -R coder:coder /home/coder

# 4. Lock down user shell to /usr/sbin/nologin so integrated terminal cannot spawn shells
RUN usermod -s /usr/sbin/nologin coder

# 5. Inject hardened VS Code User settings (hide terminal, disable telemetry)
RUN cat <<'EOF' > /home/coder/.local/share/code-server/User/settings.json
{
  "workbench.colorTheme": "Default Dark Modern",
  "workbench.startupEditor": "none",
  "workbench.panel.defaultLocation": "bottom",
  "terminal.integrated.defaultProfile.linux": null,
  "terminal.integrated.profiles.linux": {},
  "telemetry.telemetryLevel": "off",
  "update.mode": "none",
  "extensions.autoUpdate": false,
  "extensions.autoCheckUpdates": false,
  "security.workspace.trust.enabled": false,
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 500,
  "editor.fontSize": 14,
  "editor.tabSize": 4,
  "editor.minimap.enabled": false
}
EOF

# 6. Inject code-server config (no password, listen on 0.0.0.0:8080)
RUN cat <<'EOF' > /home/coder/.config/code-server/config.yaml
bind-addr: 0.0.0.0:8080
auth: none
cert: false
disable-telemetry: true
disable-update-check: true
EOF

RUN chown -R coder:coder /home/coder

USER coder
WORKDIR /home/coder/project

EXPOSE 8080

ENTRYPOINT ["/usr/bin/entrypoint.sh", "--bind-addr", "0.0.0.0:8080", "--auth", "none", "/home/coder/project"]
