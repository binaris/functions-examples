.PHONY: build test
.DEFAULT_GOAL := test

clean:
	docker-compose down

build: clean
	docker build . --tag quicksearch-app

test: build
	COMMAND=test docker-compose up --abort-on-container-exit --exit-code-from functions || (docker-compose down; false)
	COMMAND=test docker-compose down

test-watch: build
	COMMAND=test-watch docker-compose up || (docker-compose down; false)
	COMMAND=test-watch docker-compose down
