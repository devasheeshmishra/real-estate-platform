const express = require('express');

const app = express();

const PORT = 5000;

// Middleware to parse JSON requests

app.use(express.json());

// Temporary data for leads API

let leads = [ 
        {
            id: 1,
            name: "Rahul Sharma",
            phone: "9876543210",
            status: "New"
        },
        {
            id: 2,
            name: "Anjali Verma",
            phone: "9876543211",
            status: "Follow-up"
        },
        {
            id: 3,
            name: "Deva",
            phone: "9876543121",
            status: "Follow-up"
        },
        {
            id: 4,
            name: "IUC",
            phone: "9876543000",
            status: "Follow-up"
        },
        {
            id: 5,
            name: "Vijay",
            phone: "9876540012",
            status: "Follow-up"
        }
];

// ========================================
// GET ALL LEADS
// ========================================

app.get("/api/leads", (req, res) => {

    // Query parameters: 
    const { status, search, sort, page, limit } = req.query;

    let result = leads;

    //Filter leads based on status if provided
    if (status) { 
        result = result.filter(
            (lead) => lead.status.toLowerCase() === status.toLowerCase()
        );
    }

    // Search leads based on name if provided
    if (search) {
        const searchText = search.toLowerCase();

        result = result.filter(
            (lead) => 
                lead.name.toLowerCase().includes(searchText) ||
                lead.phone.includes(search)
        );
    }

    // ========================================
    // SORT VALIDATION
    // ========================================

    const allowedSortFields = ["name"];

    if (sort && !allowedSortFields.includes(sort)) {
        return res.status(400).json({
            message: "Invalid sort field."
        });
    }

    // ========================================
    // SORT LEADS
    // ========================================

    if (sort === "name") {
        result = [...result].sort(
            (a, b) => a.name.localeCompare(b.name)
        );
    }

    // Production-style pagination response:
    const total = result.length;

    // ========================================
    // PAGINATION VALIDATION
    // ========================================

    const pageNumber = page === undefined ? 1 : Number(page);
    const limitNumber = limit === undefined ? 10 : Number(limit);
    const MAX_LIMIT = 100;

    if (
        !Number.isInteger(pageNumber) ||
        pageNumber < 1
    ) {
        return res.status(400).json({
            message: "Page must be a positive integer"
        });
    }

    if (
        !Number.isInteger(limitNumber) ||
        limitNumber < 1
        || limitNumber > MAX_LIMIT
    ) {
        return res.status(400).json({
            message: "Limit must be a positive integer and less than or equal to 100"
        });
    }
    
    // ========================================
    // PAGINATION
    // ========================================
    
    const startIndex = (pageNumber - 1) * limitNumber;
    console.log("pageNumber", pageNumber, "Start Index:", startIndex, "Limit Number:", limitNumber);
    const paginatedResult = result.slice(
        startIndex,
        startIndex + limitNumber
    );

    res.status(200).json({
        data: paginatedResult,
        pagination: {
            page: pageNumber,
            limit: limitNumber,
            total: total,
            totalPages: Math.ceil(total / limitNumber)
        }
    });
});



// ========================================
// GET SINGLE LEAD
// ========================================

app.get("/api/leads/:id", (req, res) => {

    
    const id = Number(req.params.id);

    const lead = leads.find((lead) =>lead.id === id);

    if (!lead) {
        return res.status(404).json({
            message: "Lead not found"
        });
    }

    res.status(200).json(lead);
});

// ========================================
// CREATE NEW LEAD
// ========================================

app.post("/api/leads", (req, res) => {
    const { name, phone, status } = req.body;
    // console.log("Testing here...", req.body);

    if (!name || !phone || !status) {
        return res.status(400).json({
            message: "Name, phone, and status are required"
        });
    }

    const newLead = {
        id: Date.now(),
        name,
        phone,
        status
    };

    leads.push(newLead);

    res.status(201).json(newLead);
});

// ========================================
// UPDATE LEAD
// ========================================

app.put("/api/leads/:id", (req, res) => {
    const id = Number(req.params.id);

    const lead = leads.find((lead) => lead.id === id);

    if (!lead) {
        return res.status(404).json({
            message: "Lead not found"
        })
    }

    const { name, phone, status } = req.body;

    // Validation name
    if (name !== undefined && name.trim() === "") {
        return res.status(400).json({
            message: "Name cannot be empty"
        });
    }

    // Validation phone
    if (phone !== undefined && !/^\d{10}$/.test(phone)) {
        return res.status(400).json({
            message: "Phone must be a 10-digit number"
        });
    }

    // Validation status
    const allowedStatuses = [
        "New",
        "Follow-up",
        "Converted",
        "Lost"
    ];

    if (status && !allowedStatuses.includes(status)) {
        return res.status(400).json({
            message: "Invalid status."
        });
    }

    // Update leads without changing 
    if (
        name === undefined &&
        phone === undefined &&
        status === undefined
    ) {
        return res.status(400).json({
            message: "At least one field is required to update"
        });
    }

    // Update lead details
    lead.name = name ?? lead.name;
    lead.phone = phone ?? lead.phone;
    lead.status = status ?? lead.status;

    res.status(200).json(lead);
});

// ========================================
// DELETE LEAD
// ========================================

app.delete("/api/leads/:id", (req, res) => {
    const id = Number(req.params.id);

    const leadIndex = leads.findIndex((lead) => lead.id === id);

    if (leadIndex === -1) {
        return res.status(404).json({
            message: "Lead not found"
        });
    }

    const deletedLead = leads.splice(leadIndex, 1);

    res.status(200).json({
        message: "Lead deleted successfully",
        lead: deletedLead[0]
    });
});

// ========================================
// START THE SERVER
// ========================================

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
})