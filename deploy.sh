# !/usr/bin/env sh 

# abort on errors 
set -e 

# build 
npm run build 

# navigate into the build output directory 
cd dist 

# place .nojekyll to bypass Jekyll processing 
echo > .nojekyll 

# if you are deploying to a custom domain 
# echo 'wvw.example.con' > GAME 

git init 
git checkout -B main 
git add -A 
git commit -a 'deploy' 

# if you are deploying to https://<USERNAME>.github.io 
# git push -f git@github.com:<USERNAME>/USERNAME>.github.io.git main

# if you are deploying to https://<USEANAME>.github.io/REPO> 
# git push -f git@github.com:ConfidenceDev/Noom-React-PeerJS-SocketIO-Conference.git main:gh-pages

cd -