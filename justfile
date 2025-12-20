# https://github.com/casey/just
# https://just.systems/

dev:
    echo "This will constantly build and copy executable to ~/bin/gg"
    bun build --watch src/index.ts --target=bun --outfile ~/bin/gg --compile

build:
    bun run build

ship: build
    cp out/gg ~/bin/gg

linux-build:
    bun build src/index.ts --target=bun --outfile ~/Desktop/gg-linux-x64-modern --compile --minify --sourcemap --bytecode --target=bun-linux-x64-modern
    bun build src/index.ts --target=bun --outfile ~/Desktop/gg-linux-arm64 --compile --minify --sourcemap --bytecode --target=bun-linux-arm64

linux-dev:
    bun build --watch src/index.ts --target=bun --outfile ~/Desktop/gg-linux-arm64 --compile --minify --sourcemap --bytecode --target=bun-linux-arm64

lint:
    bun run lint:check

format:
    bun run lint

install:
    bun install

outdated:
    bun outdated

test:
    bun test

release:
    bun run release

upgrade:
    bun update --interactive
    bunx biome migrate --write

docs-dev:
    bun run docs:dev

docs:
    bun run docs:build
    bun run docs:preview
