# Get involved

Suppose that you need it to work in a particular way that might not be intuitive
for everyone, you can always make it a feature that is off by default with a
configuration choice.

## File feature requests and bug reports

Number one thing to do is to engage in a discussion: <https://github.com/peterbe/gg2/issues>

## Local dev

You need [Bun](https://bun.sh/) and [just](https://github.com/casey/just). And `git`
of course.

Get started with:

```bash
bun install
```

You can run any command with:

```bash
bun run src/index.ts
```

for example,

```bash
bun run src/index.ts --help
```

or, to run the configuration

```bash
bun run src/index.ts configure
```

Another practical way is to run `just build` which will generate a new `./out/gg`
executable. You can symlink to make this executable the one you're using.
For example:

```bash
just build
ln -s out/gg ~/bin/gg2
which gg2
gg2 --help
```

Once you've set that up, you can use `just dev`, which continually builds a
new `./out/gg`. That way, you can have two terminals open side by side (building
on the instructions about symlink above).
In one terminal:

```bash
just dev
```

In another terminal:

```bash
gg2 --help
```

This way, as soon as you save a change to a `.ts` file, it becomes immediately
usable in your executable.

## Testing and linting

All code formatting is automated and entirely handled by `biome`. To lint *and* format
run:

```bash
just format
```

If it fails, it probably means you need to manually address something.

To test, best is to run `just build` but to run the (limited) end-to-end tests, run:

```bash
just test
```

## Documentation

To update the documentation (this!), you can run:

```bash
just docs-dev
```

and open <http://localhost:5173/> which reloads automatically when you edit the
`.md` files.
