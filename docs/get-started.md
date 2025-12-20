# Get started

To use `gg2` on your terminal you have to install it and add it to you `$PATH`.
Like any other CLI tool.

## macOS

Install it with:

```bash
brew tap peterbe/gg2
brew install gg2
```

Then configure bash completion. In your `~/.bashrc` or `~/.zshrc`, depending on what
you use, append this:

```sh
source <(gg2 shell-completion)
```

Now type, to test if it worked:

```bash
gg2
```

## Linux

You can use [Homebrew on Linux](https://docs.brew.sh/Homebrew-on-Linux) too.
But let's focus on how to download the binary manually.

1. Go to <https://github.com/peterbe/gg2/releases>
1. Look for the latest version (usually the topmost)
1. Click to download the file `gg-linux-arm64` or `gg-linux-x64` file depending on your CPU
1. Move the downloaded binary file to somewhere on your `$PATH`

To know what a good place to put it is, use:

```bash
echo $PATH
```

and look for a directory that is available to the user.

For example:

```bash
wget https://github.com/peterbe/gg2/releases/download/v0.0.13/gg-linux-arm64
mv gg-linux-arm64 ~/.local/bin/gg2
```

Then configure bash completion. In your `~/.bashrc` or `~/.zshrc`, depending on what
you use, append this:

```sh
source <(gg2 shell-completion)
```

Now type, to test if it worked:

```bash
gg2
```

## From source

To do this you need `Bun`.

```bash
bun run build
```

That'll create an executable called `out/gg` by default. Test it with:

```bash
./out/gg --help
```

Now, move this executable somewhere on your `$PATH`. For example:

```bash
mv out/gg ~/.local/bin/gg2
```

```sh
source <(gg2 shell-completion)
```

Now type, to test if it worked:

```bash
gg2
```
