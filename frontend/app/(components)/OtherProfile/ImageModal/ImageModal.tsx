import React from 'react';
import styles from './ImageModal.module.css';

interface ModalProps {
    imageUrl: string;
    onClose: () => void;
}

const ImageModal: React.FC<ModalProps> = ({ imageUrl, onClose }) => {
    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent}>
                <img src={imageUrl} alt="Enlarged" className={styles.enlargedImage} />
            </div>
        </div>
    );
};

export default ImageModal;