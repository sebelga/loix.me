#! /bin/sh

# convert CRLF to LF
# Credits: https://gist.github.com/jappy/2012320

# --------------------
# How to
# --------------------
# 1. Make executable
# chmod +x dos2unix.sh

# 2. Apply
# ./dos2unix.sh filename.txt
# ./dos2UNIX.sh [ab]*.txt

convertFile() {
    FILE=$1
    if [[ -f $FILE ]]; then
        echo "Converting $FILE $(pwd)"
        tr -d '\015' < "$FILE" > "tmp.$FILE"
        mv "tmp.$FILE" "$FILE"
    fi
}

changeEOL() {
    for file in *
    do
        root="${file%.*}"
        ext="${file#"$root"}"
        if [[ "$ext" =~ ^(\.toml|\.md|\.html|\.js|\.scss|\.css|\.json)$ ]]; then
            convertFile $file
        fi
    done

    # Recursively change subdirectories
    for d in ./*/ ; do (cd "$d" && changeEOL); done
}

# Recursively all the folders
for d in ./*/ ; do (cd "$d" && changeEOL); done

# Files in root
for file in *
do
    convertFile $file
done

# dotfiles in root
for file in .*
do
    convertFile $file
done
