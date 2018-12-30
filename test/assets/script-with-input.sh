echo "Hi"
echo "What's your name:"
read name
echo "$name... That's a nice name."
read -p "what's you job: " job # -p text is printed past stdout somehow
echo Hello, $job $name!