examples=($(ls -d */ | grep -v '*'))

for example in "${examples[@]}"
do
  ts="${example}tsconfig.json"
  webpack="${example}webpack.config.js"

  $(rm $ts)
  $(rm $webpack)

  echo $(link ./tsconfig.json $ts)
  echo $(link ./webpack.config.js $webpack)
  echo "linked ${example}"
done