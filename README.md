# gg2

CLI tool for creating, committing, and generally managing your git branches.

## Development

```bash
git clone https://github.com/peterbe/gg2.git
cd gg2
bun install
bun run build
```

This will create an executable called `out/gg`.
You can test it with:

```bash
./out/gg --help
```

But if you don't want to compile every time, you can simply type, for example:

```bash
bun run src/index.ts --help
```

If you prefer to test with the compiled executable, you can run:

```bash
bun build --watch src/index.ts --target=bun --outfile ~/bin/gg --compile
```

which will constantly compile an executable and it into your `~/bin` directory.

### Test and linting

To run the unit tests:

```bash
bun test
```

To *format* and check linting, run:

```bash
bun run lint
```

If you want to check the linting without formatting, run:

```bash
bun run lint:check
```

