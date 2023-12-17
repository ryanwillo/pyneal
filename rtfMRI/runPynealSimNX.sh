#!/bin/bash
# Bash script to start a pyneal scan simulator session

# hack to get VS Code to work in VM
unset GTK_PATH

# Function to run commands in a new terminal
function run_in_terminal {
	local title="$1"	# Custom title for the terminal window
	local command="$2"	# Command to run in the terminal
	gnome-terminal --tab --title="$title" -- bash -c "source /home/cinl/miniconda3/bin/activate pynealenv; $command; read -p 'Press Enter to return, or close this terminal...'; exec bash"
}

# Pyneal directories
pyneal="/home/cinl/repos/pyneal"
pynealscanner="$pyneal/pyneal_scanner"
pynealsims="$pynealscanner/simulation/scannerSimulators"
scannerdata="$pyneal/rtfMRI/scannerData"

# Commands to run in each terminal
command1="python $pynealsims/SiemensNX_sim.py $scannerdata/20231203.rtfmri_dev01.CINL6914 000005 -t 1000 -n 000014"
title1="Simulator"

command2="python $pynealscanner/pynealScanner.py"
title2="Pyneal Scanner"

command3="python $pyneal/pyneal.py --settingsFile $pyneal/setupConfig.yaml --noGUI"
title3="Pyneal"

command4="python $pyneal/rtfMRI/plotResults.py"
title4="Plot Results"

# Run commands in new terminals
run_in_terminal "$title1" "$command1" &
sleep 2 # Pause for two seconds before the next script is launched
run_in_terminal "$title2" "$command2" &
sleep 2 # Pause for two seconds before the next script is launched
run_in_terminal "$title3" "$command3" &
sleep 2 # Pause for two seconds before the next script is launched
run_in_terminal "$title4" "$command4" &


