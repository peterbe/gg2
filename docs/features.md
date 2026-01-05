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
branch and offer to create a new GitHub PR automatically. This is what happens
when I ran `gg2 commit`

```text
➜  gg2 git:(peterbe-write-a-features-page-for-documentation) ✗ gg2 commit

Untracked files:
docs/features.md            7 seconds old

✔ Do you want to add these untracked files? [y/n/i] y
✔ Title: Write a Features page for documentation
✔ Push to origin: Yes
Changes pushed to origin/peterbe-write-a-features-page-for-documentation

https://github.com/peterbe/gg2/pull/new/peterbe-write-a-features-page-for-documentation
(⌘-click to open URLs)

✔ Create new PR: Yes
✔ Title: Write a Features page for documentation
Creating PR from peterbe-write-a-features-page-for-documentation to main with title "Write a Features page for documentation"
Pull request created:
https://github.com/peterbe/gg2/pull/85
```

1. It asked about the list of untracked files. I chose `y` to say yes, add it.
1. It *prefilled* the input for the `Title` from the previous `gg2 start` command
1. It asked if I want to push the branch to the remote origin
1. It asked if I wanted to create a new GitHub PR
1. For the automatically created PR, it prefilled to ask what the title should be
1. Lastly, it prints the URL of the newly created PR

## `commit` more

When you've started a branch, and type `gg2 commit` it will default to the commit
message from the initial `gg2 start`. But it's likely that you want a different
commit message for more/additional commit messages later. Simply
`gg2 commit Your commit message here` or if it contains characters that can cause
trouble with your shell, use quotation marks:

```bash
gg2 commit "The o'clock costs $10 < you & me"
```

But remember, the `gg2 commit` is always interactive. It just suggests and prefills
the commit message. You can type `gg2 commit` and override the default prompt.

## `branches`

The `gg2 branches` command is like `git branch` which lists your branches, including
highlighting the current one you're on. But it sorts them by most recently touched
and how long ago that was. It also indicates which branches have already been
merged into the default branch.

This is an example output:

```text
➜  gg2 git:(peterbe-write-a-features-page-for-documentation) ✗ gg2 branches
4 minutes ago         peterbe-write-a-features-page-for-documentation    (Your current branch)
2 weeks ago           main   (merged already)
2 weeks ago           peterbe-dont-suggest-to-check-out-when-deleting-all-and-1-found   (merged already)
2 months ago          peterbe-do-it-for-github-pr-too
2 months ago          peterbe-use-correct-base-branch-in-new-prs
3 months ago          peterbe-correct-node-id-when-enabling-auto-merge
3 months ago          peterbe-enable-auto-merge
4 months ago          peterbe-sample-branch-delete-me-after
```

Anything you type after the word `branches` becomes a fuzzy search filter. For example:

```text
➜  gg2 git:(peterbe-write-a-features-page-for-documentation) ✗ gg2 branches sdf
2 weeks ago           peterbe-dont-suggest-to-check-out-when-deleting-all-and-1-found   (merged already)
4 months ago          peterbe-sample-branch-delete-me-after
```

This text snippet doesn't show the highlighting but both those branches contains
the letters `sdf`, in that order

- peterbe-dont-**s**uggest-to-check-out-when-**d**eleting-all-and-1-**f**ound
- peterbe-**s**ample-branch-**d**elete-me-a**f**ter

And if the filtering leads to exactly 1 match, it offers to check that branch out:

```text
➜  gg2 git:(peterbe-write-a-features-page-for-documentation) ✗ gg2 branches sampl
4 months ago          peterbe-sample-branch-delete-me-after
? Check out (peterbe-sample-branch-delete-me-after): (Y/n)
```

You can also use `gg2 branches --cleanup-all` to delete the local branches that are
already merged into the default branch.

