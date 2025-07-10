# https://github.com/casey/just
# https://just.systems/

# dev:
#     bun run dev

build:
    bun run build

ship: build
    cp out/gg ~/bin/gg

rapid-build:
    bun build --watch src/index.ts --target=bun --outfile ~/bin/gg --compile

linux-build:
    bun build src/index.ts --target=bun --outfile ~/Desktop/gg-linux-x64-modern --compile --target=bun-linux-x64-modern
    bun build src/index.ts --target=bun --outfile ~/Desktop/gg-linux-arm64 --compile --target=bun-linux-arm64

# lint:
#     bun run lint:check

format:
    bun run lint

install:
    bun install

outdated:
    bun outdated
    bunx npm-check-updates --interactive

# test:
#     bun run test

# alias
upgrade: outdated
