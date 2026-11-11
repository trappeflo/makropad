# Zweck: Include-Pfad der FS-Bibliothek für den Build der USB-Bibliothek ergänzen (Spike #43).
# Inhalt: Die USB-Bibliothek des Arduino-Frameworks enthält Massenspeicher-Quellen, die FS.h brauchen.
#         PlatformIO findet diesen Pfad nicht von selbst. Das Skript hängt ihn an die Include-Pfade an.
#         Ein Flag in der platformio.ini scheitert, weil Windows-Pfade mit Backslashes zerlegt werden.
import os

Import("env")  # noqa: F821  (von PlatformIO bereitgestellt)

framework_dir = env.PioPlatform().get_package_dir("framework-arduinoespressif32")  # noqa: F821
env.Append(CPPPATH=[os.path.join(framework_dir, "libraries", "FS", "src")])  # noqa: F821
