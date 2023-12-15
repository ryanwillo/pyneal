import json
import time
import matplotlib.pyplot as plt

def update_plot(averages):
	# Process the data received from the results server and update the plot
	plt.clf() # Clear previous plot to update it with new data
	plt.plot(averages)
	plt.xlabel('Volume')
	plt.ylabel('Average')
	plt.title('Real-time Plot')
	plt.grid(True)
	plt.pause(0.1) # Add a short pause to give the plot time to update
			
		
averages = []
	
import socket

# socket configs
RESULTS_IP = '127.0.0.1'  # Pyneal address
RESULTS_PORT = 5556     	# results server port number
BUFFER_SIZE = 1024

def request_volume_data(volume):
	# Create a socket connection to the results server
	client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
	client_socket.connect((RESULTS_IP, RESULTS_PORT))
	
	# Send a request for a specific volume
	client_socket.send(volume.encode())
	
	# Receive the data from the results server
	data = client_socket.recv(BUFFER_SIZE).decode()
	
	# Close the socket connection
	client_socket.close()
	
	return data

if __name__ == "__main__":
	try:
		volume = 0
		while True:
			# Format the request based on the volume number (e.g., '0000' for volume 1, '0001' for volume 2)
			request = f"{volume:04d}"
			
			while True:
				data = request_volume_data(request)
				try:
					json_data = json.loads(data)
					found_results = json_data.get('foundResults', False)
				
					if found_results:
						# Process the received data and update the plot
						average = json_data.get('average', 0)
						print(f"Received average for volume {volume}: {average}")
						
						# Add the new average to the list of averages
						averages.append(average)
						
						# Update the plot with new data
						update_plot(averages)
						
						# Break the inner loop because we got results
						break
						
					else:
						print("Results for the current volume have not been calculated yet")
						# If results are not found, wait a while before asking again
						time.sleep(0.5)
						
				except json.JSONDecodeError:
					print("Error: Invalid JSON format in the received data.")
				
			# Increment the volume number for the next request
			volume += 1
			
	except KeyboardInterrupt:
		pass

