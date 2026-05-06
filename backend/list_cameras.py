import cv2

def list_available_cameras(max_to_test=5):
    available_indices = []
    for i in range(max_to_test):
        # Try DirectShow first as it's common on Windows
        cap = cv2.VideoCapture(i, cv2.CAP_DSHOW)
        if cap.isOpened():
            ret, _ = cap.read()
            if ret:
                available_indices.append(i)
                print(f"Found Camera at Index {i} (Available)")
            else:
                print(f"Found Camera at Index {i} (Busy or Error capturing)")
            cap.release()
        else:
            # Try default if DSHOW fails
            cap = cv2.VideoCapture(i)
            if cap.isOpened():
                available_indices.append(i)
                print(f"Found Camera at Index {i} (Available via Default)")
                cap.release()
            else:
                print(f"No Camera found at Index {i}")
    
    return available_indices

if __name__ == "__main__":
    print("Scanning for available camera indices...")
    cameras = list_available_cameras()
    if cameras:
        print(f"\n✅ Suggested indices to use: {cameras}")
    else:
        print("\n❌ No cameras detected. Please check your physical connection.")
