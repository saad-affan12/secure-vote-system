import mysql from 'mysql2/promise'

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONN_LIMIT) || 10,
  queueLimit: 0,
})

export async function testConnection() {
  const conn = await pool.getConnection()
  try {
    await conn.query('SELECT 1')
    return true
  } finally {
    conn.release()
  }
}

export async function ensureTables() {
  const conn = await pool.getConnection()
  try {
    // users table (keep existing schema compatible)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100) UNIQUE,
        voterId VARCHAR(100) UNIQUE,
        password VARCHAR(255),
        role ENUM('admin','voter') DEFAULT 'voter',
        isVerified BOOLEAN DEFAULT FALSE,
        hasVoted BOOLEAN DEFAULT FALSE,
        otp VARCHAR(10),
        otpExpiry DATETIME,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `)

    // elections
    await conn.query(`
      CREATE TABLE IF NOT EXISTS elections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        start_date DATETIME,
        end_date DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `)

    // candidates
    await conn.query(`
      CREATE TABLE IF NOT EXISTS candidates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        election_id INT,
        user_id INT,
        party VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `)

    // votes
    await conn.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        candidate_id INT,
        election_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_vote (user_id, election_id),
        FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
        FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `)

    // Backfill older schema variants so the current API shape works reliably.
    const [electionColumns] = await conn.query('SHOW COLUMNS FROM elections')
    const electionColumnNames = new Set(electionColumns.map(col => col.Field))
    if (!electionColumnNames.has('created_at')) {
      await conn.query('ALTER TABLE elections ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
    }

    const [candidateColumns] = await conn.query('SHOW COLUMNS FROM candidates')
    const candidateColumnNames = new Set(candidateColumns.map(col => col.Field))
    if (!candidateColumnNames.has('user_id')) {
      await conn.query('ALTER TABLE candidates ADD COLUMN user_id INT NULL AFTER election_id')
    }
    if (!candidateColumnNames.has('created_at')) {
      await conn.query('ALTER TABLE candidates ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
    }
    const legacyNameColumn = candidateColumns.find(col => col.Field === 'name')
    if (legacyNameColumn && legacyNameColumn.Null === 'NO') {
      await conn.query('ALTER TABLE candidates MODIFY COLUMN name VARCHAR(255) NULL')
    }

    const [votesColumns] = await conn.query('SHOW COLUMNS FROM votes')
    const votesColumnNames = new Set(votesColumns.map(col => col.Field))
    if (!votesColumnNames.has('created_at')) {
      await conn.query('ALTER TABLE votes ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
    }

    const [voteIndexes] = await conn.query('SHOW INDEX FROM votes')
    const hasUniqueVoteIndex = voteIndexes.some(index => index.Key_name === 'unique_vote')
    if (!hasUniqueVoteIndex) {
      await conn.query('ALTER TABLE votes ADD UNIQUE KEY unique_vote (user_id, election_id)')
    }
  } finally {
    conn.release()
  }
}

