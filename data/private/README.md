# data/private

Real study logs, such as the MGM 301 Exam 2 export, go here. **Nothing in this folder is ever committed** except this README.

Two safeguards:

1. `.gitignore` hides every other file in this folder from Git.
2. `pnpm repo-checks` (run on every pull request) fails the build if a file here was committed anyway.
