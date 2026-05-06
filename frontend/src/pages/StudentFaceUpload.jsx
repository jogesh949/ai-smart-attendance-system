import { useState, useCallback } from 'react';
import { UploadCloud, Camera, CheckCircle, XCircle, Info } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../api';
import PageTransition from '../components/PageTransition';
import GlassCard from '../components/GlassCard';
import { useAuth } from '../hooks/useAuth';

const StudentFaceUpload = () => {
  const { user } = useAuth();
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const MAX_PHOTOS = 10;
  const MIN_PHOTOS_FOR_RELIABILITY = 3;

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!user?.id) {
      toast.error("User not logged in.");
      return;
    }

    if (uploadedPhotos.length + acceptedFiles.length > MAX_PHOTOS) {
      toast.error(`You can only upload a maximum of ${MAX_PHOTOS} photos.`);
      return;
    }

    const newPhotos = [];
    for (const file of acceptedFiles) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('student_id', user.id);

        await api.post('/face-embeddings/enroll', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const reader = new FileReader();
        reader.onload = (e) => {
          newPhotos.push({ id: uploadedPhotos.length + newPhotos.length, src: e.target.result, status: 'success' });
          setUploadedPhotos((prev) => [...prev, { id: prev.length + newPhotos.length, src: e.target.result, status: 'success' }]);
          toast.success(`📸 Photo ${uploadedPhotos.length + newPhotos.length + 1} saved! Looking great.`);
        };
        reader.readAsDataURL(file);

      } catch (error) {
        console.error("Error uploading photo:", error);
        toast.error("Failed to upload photo. Please try again.");
        newPhotos.push({ id: uploadedPhotos.length + newPhotos.length, src: URL.createObjectURL(file), status: 'error' });
      }
    }
  }, [uploadedPhotos, user]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': ['.jpeg', '.png', '.jpg'] } });

  const isEnrollmentComplete = uploadedPhotos.length >= MIN_PHOTOS_FOR_RELIABILITY;

  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="font-orbitron text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
              <Camera className="text-cyan-DEFAULT" size={32} />
              Face <span className="text-cyan-DEFAULT">Enrollment</span>
            </h1>
            <p className="text-text-muted mt-2 font-dm">Secure your attendance with biometric facial recognition.</p>
          </div>
        </div>

        <GlassCard className="p-8">
          <h3 className="font-orbitron text-xl font-bold text-white mb-4">Upload Your Photos</h3>
          <p className="text-text-muted text-sm mb-6">
            Please upload {MAX_PHOTOS} clear photos of your face from different angles. This helps the AI recognize you accurately.
          </p>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
              ${isDragActive ? 'border-cyan-DEFAULT bg-cyan-DEFAULT/10' : 'border-white/20 hover:border-cyan-DEFAULT/50 bg-white/5'}`}
          >
            <input {...getInputProps()} />
            <UploadCloud size={48} className="mx-auto text-cyan-DEFAULT mb-4" />
            {isDragActive ? (
              <p className="text-white font-orbitron font-bold">Drop the files here...</p>
            ) : (
              <p className="text-text-muted">Drag 'n' drop some files here, or click to select files</p>
            )}
            <p className="text-[10px] text-text-muted mt-2">JPG, PNG up to 5MB each</p>
          </div>

          <div className="mt-8">
            <h4 className="font-orbitron text-sm font-bold text-white uppercase tracking-widest mb-4">
              Progress: {uploadedPhotos.length}/{MAX_PHOTOS} photos uploaded 📸
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              <AnimatePresence>
                {uploadedPhotos.map((photo, index) => (
                  <motion.div
                    key={photo.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                    className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-white/10"
                  >
                    <img src={photo.src} alt={`Uploaded ${index + 1}`} className="w-full h-full object-cover" />
                    <div className={`absolute inset-0 flex items-center justify-center bg-black/50 ${photo.status === 'success' ? 'text-success' : 'text-danger'}`}>
                      {photo.status === 'success' ? <CheckCircle size={24} /> : <XCircle size={24} />}
                    </div>
                  </motion.div>
                ))}
                {Array.from({ length: MAX_PHOTOS - uploadedPhotos.length }).map((_, index) => (
                  <div key={`placeholder-${index}`} className="w-full aspect-square rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center text-text-muted/50 text-xs">
                    Empty Slot
                  </div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className={`mt-8 p-4 rounded-xl border ${isEnrollmentComplete ? 'border-success/20 bg-success/5' : 'border-danger/20 bg-danger/5'}`}>
            <p className={`text-[10px] font-orbitron font-bold uppercase mb-2 flex items-center gap-2 ${isEnrollmentComplete ? 'text-success' : 'text-danger'}`}>
              <Info size={12} /> Status
            </p>
            {isEnrollmentComplete ? (
              <p className="text-xs text-text-muted">
                🎉 Face profile complete! You're all set for AI recognition.
              </p>
            ) : (
              <p className="text-xs text-text-muted">
                ⚠️ Upload at least {MIN_PHOTOS_FOR_RELIABILITY} photos for reliable detection.
              </p>
            )}
          </div>
        </GlassCard>
      </div>
    </PageTransition>
  );
};

export default StudentFaceUpload;