# backend

Spring-Boot-Anwendung mit REST-API zur Sicherung und Wiederherstellung der Profile (H2-Datenbank).
Das Backend ist nicht an der Kommunikation mit dem Pad beteiligt. Rolle und Grenzen:
[ADR 0005](../docs/adr/0005-rolle-des-backends.md).

## Technik

Java 21, Spring Boot, Maven (Wrapper `mvnw`, keine Maven-Installation nötig), H2 (In-Memory im Gerüst).

## Bauen, testen, starten

Im Ordner `backend/`:

```
./mvnw test           # Tests
./mvnw spring-boot:run   # Anwendung starten (Port 8080)
```

Unter Windows in PowerShell `.\mvnw.cmd` statt `./mvnw`.

## Stand

Gerüst mit Test-Setup. REST-Endpunkte (#17), Persistenz mit H2 (#18) sowie Tests und
API-Dokumentation (#19) folgen.
