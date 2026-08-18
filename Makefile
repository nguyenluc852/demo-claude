.PHONY: install dev-api dev-web test lint typecheck check \
        docker-up docker-down docker-logs docker-prod

PY := backend/.venv/bin

install:
	python3.11 -m venv backend/.venv
	$(PY)/pip install -r backend/requirements-dev.txt
	cd frontend && npm install

dev-api:
	cd backend && .venv/bin/uvicorn app.main:app --reload --port 8000

dev-web:
	cd frontend && npm run dev

test:
	cd backend && .venv/bin/pytest -q
	cd frontend && npm test

lint:
	cd backend && .venv/bin/ruff check .
	cd frontend && npm run lint

typecheck:
	cd backend && .venv/bin/mypy app tests
	cd frontend && npm run typecheck

check: lint typecheck test

# --- Docker ---------------------------------------------------------------

docker-up:
	docker compose up --build

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

docker-prod:
	docker compose -f docker-compose.prod.yml up --build -d
