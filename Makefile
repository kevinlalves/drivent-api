.PHONY: install-dependencies build-database boot-startup

boot-startup: install-dependencies build-database
	npm run dev

build-database:
	npm run dev:migration:generate
	npm run test:migration:generate
	npm run client:generate

install-dependencies:
	npm install
