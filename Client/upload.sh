# !/bin/bash
function usage(){
	echo "sh upload.sh $USER $TARGET"
	echo "eg: sh upload.sh stv1024 web-mobile"
}
if [ $# -ne 2 ];then
	usage
	exit 2
fi
RUSER=$1
TARGET=$2
REMOTE_IP=111.231.87.137
REMOTE_DIR=www
TARGET_PATH=build/$TARGET
if [ ! -d $TARGET_PATH ];then
	echo "$TARGET_PATH not exist"
	exit 1
fi
cd build;
tar czvf "$TARGET.tgz" "$TARGET"
scp "$TARGET.tgz" $RUSER@$REMOTE_IP:/home/$RUSER
ssh $RUSER@$REMOTE_IP "tar -xf $TARGET.tgz;rm -fr $REMOTE_DIR/*;  mv -f $TARGET/* $REMOTE_DIR;rm $TARGET.tgz;rm -fr $TARGET"
