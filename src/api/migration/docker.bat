@ECHO OFF
docker run -it --rm --net=host -v ${PWD}\migrations:/migrations ghcr.io/dimitri/pgloader pgloader /mssql.load
