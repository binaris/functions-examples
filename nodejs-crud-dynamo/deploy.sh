#!/bin/bash
functions=( createDriversTable createDriver readDriver updateDriver deleteDriver )
for i in "${functions[@]}"
do
  bn deploy $i
done
