const pool = require("../db");

const getLeads = async ({
    status,
    search,
    sort,
    order,
    pageNumber,
    limitNumber
}) => {
        let baseQuery = "SELECT * FROM leads";
        let countQuery = "SELECT COUNT(*) AS total FROM leads";

        const conditions = [];
        const filterValues = [];

        // Status filter
        if (status) {
            filterValues.push(status);

            conditions.push(
                `status ILIKE $${filterValues.length}`
            );
        }

        // Search by name or phone
        if (search) {
            filterValues.push(`%${search}%`);

            conditions.push(`
                (
                    name ILIKE $${filterValues.length}
                    OR phone LIKE $${filterValues.length}
                )
            `);
        }

        // WHERE clause
        let whereClause = "";

        if (conditions.length > 0) {
            whereClause = " WHERE " + conditions.join(" AND ");
        }

        baseQuery += whereClause;
        countQuery += whereClause;

        // Sorting
        const allowedSortFields = [
            "id",
            "name",
            "status"
        ];

        if (sort) {
            if (!allowedSortFields.includes(sort)) {
                return res.status(400).json({
                    message: "Invalid sort field."
                });
            }

            const sortOrder =
                order && order.toLowerCase() === "desc"
                    ? "DESC"
                    : "ASC";

            baseQuery += ` ORDER BY ${sort} ${sortOrder}`;
        } else {
            baseQuery += " ORDER BY id ASC";
        }

        // Pagination
        const offset = (pageNumber - 1) * limitNumber;

        const dataValues = [
            ...filterValues,
            limitNumber,
            offset
        ];

        const limitParameter = filterValues.length + 1;
        const offsetParameter = filterValues.length + 2;

        baseQuery += `
            LIMIT $${limitParameter}
            OFFSET $${offsetParameter}
        `;

        const [dataResult, countResult] = await Promise.all([
            pool.query(baseQuery, dataValues),
            pool.query(countQuery, filterValues)
        ]);

        const totalRecords = Number(
            countResult.rows[0].total
        );

        const totalPages = Math.ceil(
            totalRecords / limitNumber
        );

        return {
            data: dataResult.rows,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                totalRecords,
                totalPages
            }
        };
};

const getLeadById = async (id) => {
    const result = await pool.query(
        "SELECT * FROM leads WHERE id = $1",
        [id]
    );

    return result.rows[0] || null;
};

const createLead = async ({ name, phone, status }) => {
    const result = await pool.query(
        `INSERT INTO leads (name, phone, status)
        VALUES ($1, $2, $3)
        RETURNING *`,
        [name, phone, status]
    );

    return result.rows[0];
};

const updateLead = async (id, { name, phone, status }) => {
    const result = await pool.query(
        `UPDATE leads
        SET
            name = COALESCE($1, name),
            phone = COALESCE($2, phone),
            status = COALESCE($3, status)
        WHERE id = $4
        RETURNING *`,
        [name, phone, status, id]
    );

    return result.rows[0] || null;
}

const deleteLead = async (id) => {
    const result = await pool.query(
        `DELETE FROM leads WHERE id = $1 RETURNING *`,
        [id]
    );

    return result.rows[0] || null;
}

module.exports = {
    getLeads,
    getLeadById,
    createLead,
    updateLead,
    deleteLead
};