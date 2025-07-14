# gg2

CLI tool for creating, committing, and generally managing your git branches.

## Compiled

The source code for this CLI is written in TypeScript.

The code is **compiled** using [`bun`](https://bun.com/docs/bundler/executables) to
an executable that is compiled specifically for your operating system, for example,
`bun-darwin-arm64`. Because it's compiled to **a single executable binary**, the
start-up time to run the CLI is **very fast**. ⚡

For example, the GitHub CLI, `gh`, is written in Go and is also compiled to a single
executable binary. For comparison, running the [`hyperfine` command-line
benchmarking tool](https://github.com/sharkdp/hyperfine) using:

```bash
hyperfine "gg --version" "gh --version"
```

Results:

```text
Benchmark 1: gg --version
  Time (mean ± σ):      25.0 ms ±   0.7 ms    [User: 21.2 ms, System: 9.4 ms]
  Range (min … max):    23.6 ms …  28.5 ms    108 runs

Benchmark 2: gh --version
  Time (mean ± σ):      29.3 ms ±   0.6 ms    [User: 26.9 ms, System: 8.0 ms]
  Range (min … max):    27.9 ms …  31.1 ms    90 runs

Summary
  gg --version ran
    1.17 ± 0.04 times faster than gh --version
```

The point is; it takes on average **25 milliseconds** to run the `gg --version` command.

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

