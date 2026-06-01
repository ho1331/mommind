def _register_and_auth(client, email="mood@test.com"):
    r = client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "pass1234",
        "confirm_password": "pass1234",
    })
    token = r.json()["access_token"]
    # activate trial subscription so restricted endpoints work
    client.post("/api/v1/subscription", json={"plan": "trial"}, headers={"Authorization": f"Bearer {token}"})
    return {"Authorization": f"Bearer {token}"}


def test_create_mood(client):
    h = _register_and_auth(client, "mood1@test.com")
    r = client.post("/api/v1/moods", json={"mood": "okay", "note": "Feeling alright"}, headers=h)
    assert r.status_code == 200
    assert r.json()["mood"] == "okay"


def test_list_moods(client):
    h = _register_and_auth(client, "mood2@test.com")
    client.post("/api/v1/moods", json={"mood": "tired"}, headers=h)
    r = client.get("/api/v1/moods", headers=h)
    assert r.status_code == 200
    assert len(r.json()) >= 1


def test_get_plans_generates_defaults(client):
    h = _register_and_auth(client, "plan1@test.com")
    r = client.get("/api/v1/plans", headers=h)
    assert r.status_code == 200
    assert len(r.json()) == 5


def test_complete_plan(client):
    h = _register_and_auth(client, "plan2@test.com")
    plans = client.get("/api/v1/plans", headers=h).json()
    plan_id = plans[0]["id"]
    r = client.patch(f"/api/v1/plans/{plan_id}", json={"completed": True}, headers=h)
    assert r.status_code == 200
    assert r.json()["completed"] is True


def test_list_articles(client):
    h = _register_and_auth(client, "article1@test.com")
    r = client.get("/api/v1/articles", headers=h)
    assert r.status_code == 200
    # articles are seeded in the main DB, not test DB — so just check structure
    data = r.json()
    # may be empty in test DB (no seed), that's fine — just check it's a list
    assert isinstance(data, list)


def test_get_subscription(client):
    h = _register_and_auth(client, "sub1@test.com")
    r = client.get("/api/v1/subscription", headers=h)
    assert r.status_code == 200
    assert r.json()["plan"] == "trial"
