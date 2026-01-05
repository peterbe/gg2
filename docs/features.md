# Features

To see a list of the features run:

```bash
gg2 --help
```

but it's a long list. This page highlights the primary commands.

## `start` and `commit`

The idea of `start` and `commit` is that you only have to type a title. It will
become the branch name and the commit message (and eventually the GitHub PR
title).

```bash
gg2 start
```

It will then ask you type in a title and use that title to create a branch.

```text
➜  gg2 git:(main) ✗ gg2 start
✔ Title: Write a Features page for documentation
Created new branch: peterbe-write-a-features-page-for-documentation
```

Here, the title entered was `Write a Features page for documentation` and the
branch name becamed `peterbe-write-a-features-page-for-documentation`. The branch
name got a prefix of `peterbe-` because I had previously run `gg2 configure` and
selected a "Common branch prefix".

Now, when you're done, all you have to do is run `gg2 commit` and **it add all
changed files that are not staged**. This is the equivalent of typing:

```bash
git commit -a -m "Write a Features page for documentation"
```

but `gg2 commit` is shorter. And more interactive. For example, it will ask you
if you want to add or ignore any untracked files. It will also offer to push the
branch and offer to create a new GitHub PR automatically.

```text

```
