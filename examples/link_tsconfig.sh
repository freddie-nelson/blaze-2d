examples=($(ls -d */ | grep -v '^_'))

for example in "${examples[@]}"
do
  file="${example}tsconfig.json"
  echo $(link ./tsconfig.json $file)
  echo "linked ${file}"
done