const express = require("express");
const mysql = require("mysql2/promise");

const app = express();
const pool = mysql.createPool({
	host: process.env.DB_HOST || "127.0.0.1",
	port: Number(process.env.DB_PORT || 3306),
	user: process.env.DB_USER || "utente",
	password: process.env.DB_PASSWORD || "password",
	database: process.env.DB_NAME || "baretta",
	waitForConnections: true,
	connectionLimit: 10,
});

async function initializeDatabase() {
	await pool.query(`
		CREATE TABLE IF NOT EXISTS prodotti (
			id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
			nome VARCHAR(120) NOT NULL,
			descrizione TEXT,
			prezzo DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
			quantita INT UNSIGNED NOT NULL DEFAULT 0,
			creato_il TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		) ENGINE=InnoDB
	`);

	await pool.query(`
		CREATE TABLE IF NOT EXISTS personale (
			id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
			nome VARCHAR(80) NOT NULL,
			cognome VARCHAR(80) NOT NULL,
			ruolo VARCHAR(80),
			email VARCHAR(254) UNIQUE,
			creato_il TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		) ENGINE=InnoDB
	`);

	await pool.query(`
		CREATE TABLE IF NOT EXISTS ordini (
			id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
			prodotto_id INT UNSIGNED NOT NULL,
			personale_id INT UNSIGNED,
			quantita INT UNSIGNED NOT NULL DEFAULT 1,
			prezzo_unitario DECIMAL(10, 2) NOT NULL,
			stato VARCHAR(30) NOT NULL DEFAULT 'in_attesa',
			creato_il TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			CONSTRAINT fk_ordini_prodotto FOREIGN KEY (prodotto_id)
				REFERENCES prodotti(id) ON DELETE RESTRICT,
			CONSTRAINT fk_ordini_personale FOREIGN KEY (personale_id)
				REFERENCES personale(id) ON DELETE SET NULL
		) ENGINE=InnoDB
	`);
}

app.get("/health", async (_req, res) => {
	try {
		await pool.query("SELECT 1");
		res.json({ status: "ok", database: "connesso" });
	} catch (error) {
		res.status(503).json({ status: "errore", database: "non disponibile" });
	}
});

async function start() {
	await initializeDatabase();
	const port = Number(process.env.PORT || 3000);
	app.listen(port, () => {
		console.log(`Server avviato sulla porta ${port}; database pronto.`);
	});
}

start().catch(async (error) => {
	console.error("Avvio non riuscito:", error.message);
	await pool.end();
	process.exitCode = 1;
});
