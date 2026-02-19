---
description: Deploy changes to GitHub (triggers Vercel deployment)
---
// turbo-all
1. Add all changes to git
   `git add .`

2. Commit changes with a timestamp
   `git commit -m "Update via Agent: $(date)"`

3. Push changes to remote repository
   `git push`
