import psutil

# processes to leave alone
WHITELIST = {
    "chrome", "chromium", "chromium-browser",
    "python", "python3",
    "bash", "zsh", "sh",
    "systemd", "dbus-daemon", "Xorg", "x11",
}

# known non-essential GUI apps to kill
KILL_LIST = {
    "spotify", "discord", "slack", "telegram-desktop", "signal-desktop",
    "thunderbird", "evolution",
    "code", "code-oss", "atom", "sublime_text", "gedit", "kate", "mousepad",
    "nautilus", "thunar", "nemo", "dolphin",
    "vlc", "totem", "rhythmbox", "clementine", "celluloid",
    "libreoffice", "soffice",
    "gimp", "inkscape", "blender",
    "zoom", "teams", "skypeforlinux",
    "steam", "lutris",
    "transmission", "deluge",
}

killed = []

for proc in psutil.process_iter(["pid", "name"]):
    try:
        name = proc.info["name"].lower()
        if name in KILL_LIST and name not in WHITELIST:
            proc.kill()
            killed.append(f"  killed: {proc.info['name']} (pid {proc.info['pid']})")
    except (psutil.NoSuchProcess, psutil.AccessDenied):
        pass

if killed:
    print("Zen mode active. Killed:")
    print("\n".join(killed))
else:
    print("Zen mode active. Nothing to kill.")
