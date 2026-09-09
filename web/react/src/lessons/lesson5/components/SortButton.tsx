import { useState } from 'react';
import styles from './SortButton.module.css';

interface SortButtonProps {
    text: string;
    active: boolean;
    onClick: () => void;
}

function SortButton({ text, active, onClick }: SortButtonProps) {
    return (
        <button
            type='button'
            className={active ? styles.active : ""}
            onClick={onClick}
        >
            {text}
        </button>
    );
}

export default SortButton;