import styles from './taskBlock.module.css';
import { useState } from 'react';

function TaskBlock() {
    return (
        <div className={`${styles.root} ${styles.taskBlock}`}>
            <input type="checkbox" />
            <div className={styles.taskLabel}>lorem ipsum</div>
        </div>
    );
}

export default TaskBlock;