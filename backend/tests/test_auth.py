def test_register_success(client):
    r = client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "password": "password123",
        "confirm_password": "password123",
    })
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert data["user"]["email"] == "test@example.com"


def test_register_duplicate_email(client):
    payload = {"email": "dup@example.com", "password": "pass1234", "confirm_password": "pass1234"}
    client.post("/api/v1/auth/register", json=payload)
    r = client.post("/api/v1/auth/register", json=payload)
    assert r.status_code == 400


def test_register_password_mismatch(client):
    r = client.post("/api/v1/auth/register", json={
        "email": "x@example.com", "password": "aaa12345", "confirm_password": "bbb12345"
    })
    assert r.status_code == 422


def test_login_success(client):
    client.post("/api/v1/auth/register", json={
        "email": "login@example.com", "password": "pass1234", "confirm_password": "pass1234"
    })
    r = client.post("/api/v1/auth/login", json={"email": "login@example.com", "password": "pass1234"})
    assert r.status_code == 200
    assert "access_token" in r.json()


def test_login_wrong_password(client):
    client.post("/api/v1/auth/register", json={
        "email": "wrongpw@example.com", "password": "pass1234", "confirm_password": "pass1234"
    })
    r = client.post("/api/v1/auth/login", json={"email": "wrongpw@example.com", "password": "wrong"})
    assert r.status_code == 401
