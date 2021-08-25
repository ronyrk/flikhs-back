const express = require('express')
const route = express.Router()
const slugify = require('slugify')
const Country = require('../model/countryCity.model')
const Department = require('../model/department.model')
const Doctor = require('../model/doctor.model')
const DoctorReview = require('../model/doctorReview.model')
const { usersignin, admin, moderator } = require('../middleware/auth.middleware')
const mongoose = require('mongoose')
const shortId = require('shortid')

const createList = (countries, parentId = null) => {
    const countryList = []
    let country
    if (parentId == null) {
        country = countries.filter(cat => cat.parentId == undefined)
    } else {
        country = countries.filter(cat => cat.parentId == parentId)
    }
    for (let cate of country) {
        countryList.push({
            _id: cate._id,
            name: cate.name,
            slug: cate.slug,
            children: createList(countries, cate._id)
        })
    }
    return countryList
}
//---------------------------------------------------------------------------------------------------------------
route.get('/initialdata', async (req, res) => {
    try {
        let countrylist = await Country.find().sort('name').exec()
        let countries = createList(countrylist)
        let departments = await Department.find().exec()

        res.status(200).json({ countries, departments })
    } catch (error) {
        res.status(400).json({ error: "Something went wrong" })
    }
})



//---------------------------------------------------------------------------------------------------------------

route.post("/create", (req, res) => {
    let { general, about, education, hospital, experience, language, social, category, profileImage } = req.body

    if (!general.name) {
        return res.status(400).json({ error: "Name is required" })
    }

    let data = {
        general,
        about,
        education,
        hospital,
        experience,
        language,
        social,
        category,
        profileImage,
        slug: slugify(general.name) + "-" + shortId.generate()
    }


    let _doctor = new Doctor(data)
    _doctor.save()
        .then(doctor => {
            res.status(201).json({ success: true, doctor })
        })
        .catch(err => {
            console.log(err);
            res.status(400).json({ error: "Something went wrong" })
        })
})
//---------------------------------------------------------------------------------------------------------------

route.patch("/update/:id", (req, res) => {
    let { general, about, education, hospital, experience, language, social, category, profileImage, isApproved } = req.body
    let id = req.params.id
    if (!general.name) {
        return res.status(400).json({ error: "Name is required" })
    }

    let data = {
        general,
        about,
        education,
        hospital,
        experience,
        language,
        social,
        category,
        profileImage,
        isApproved
    }


    Doctor.findByIdAndUpdate(id, { $set: data }, { new: true })
        .then(doctor => {
            res.status(201).json({ success: true, doctor })
        })
        .catch(err => {
            console.log(err);
            res.status(400).json({ error: "Something went wrong" })
        })
})


//---------------------------------------------------------------------------------------------------------------------------------------

route.delete('/deletedoctor/:id', usersignin, admin, (req, res) => {
    let id = req.params.id
    Doctor.findByIdAndDelete(id)
        .then(doctor => {
            res.status(201).json({ success: true })
        })
        .catch(err => {
            console.log(err);
            res.status(400).json({ error: "Something went wrong" })
        })
})
//-----------------------------------------------------------------------------------------------------------------------------------------

route.post('/getall/:type', usersignin, admin, async (req, res) => {


    let { page, sort_by, limit, query } = req.body
    let type = req.params.type
    let queryData = {
        isApproved: type === 'pending' ? false : true
    }



    if (query) {
        queryData["general.name"] = { $regex: query, $options: "i" }

    }


    const pageOptions = {
        page: 0,
        limit: limit || 30
    }

    let sort = { "createdAt": -1 }

    if (sort_by == 'newest') {
        sort = { "createdAt": -1 }
    }
    if (sort_by == 'oldest') {
        sort = { "createdAt": 1 }
    }
    if (sort_by == 'price-asc') {
        sort = { "price": 1 }
    }
    if (sort_by == 'price-desc') {
        sort = { "price": -1 }
    }


    if (page) {
        pageOptions["page"] = parseInt(page == 0 ? 0 : page - 1, 10) || 0
    }

    Doctor.find(queryData)
        .skip(pageOptions.page * pageOptions.limit)
        .limit(pageOptions.limit)
        .sort(sort)
        .then(async doctors => {
            let count = await Doctor.countDocuments(queryData).exec()
            res.status(201).json({ success: true, doctors, count })
        })
        .catch(err => {
            console.log(err);
            res.status(400).json({ error: "Something went wrong" })
        })
})


//-----------------------------------------------------------------------------------------------------------------------------------------

route.get('/single/:id', (req, res) => {
    let id = req.params.id
    Doctor.findById(id)
        .then(doctor => {
            res.status(201).json({ success: true, doctor })
        })
        .catch(err => {
            console.log(err);
            res.status(400).json({ error: "Something went wrong" })
        })
})
//-----------------------------------------------------------------------------------------------------------------------------------------

route.get('/singledoctor/:slug', (req, res) => {
    let slug = req.params.slug
    Doctor.findOne({ slug })
        .populate('category')
        .populate('general.city')
        .populate('general.country')
        .then(doctor => {
            res.status(201).json({ success: true, doctor })
        })
        .catch(err => {
            console.log(err);
            res.status(400).json({ error: "Something went wrong" })
        })
})


//----------------------------------------------------------------------------------------------------------------------------------------

route.post('/filter', async (req, res) => {
    let { category, country, city, page, sort_by, limit } = req.body
    let categoryFetched
    let countryFetched
    let cityFetched

    let data = {
        isApproved: true
    }



    if (category) {
        let fetchedCategory = await Department.findOne({ slug: category }).exec()
        if (fetchedCategory) {
            data.category = mongoose.Types.ObjectId(fetchedCategory._id)
            categoryFetched = fetchedCategory
        }

    }
    if (country) {
        let fetchedCountry = await Country.findOne({ slug: country }).exec()
        if (fetchedCountry) {
            data["general.country"] = mongoose.Types.ObjectId(fetchedCountry._id)
            countryFetched = fetchedCountry
        }

    }
    if (city) {
        let fetchedCity = await Country.findOne({ slug: city }).exec()
        if (fetchedCity) {
            data["general.city"] = mongoose.Types.ObjectId(fetchedCity._id)
            cityFetched = fetchedCity
        }
    }




    const pageOptions = {
        page: 0,
        limit: limit || 15
    }

    let sort = { "createdAt": -1 }

    if (sort_by == 'newest') {
        sort = { "createdAt": -1 }
    }
    if (sort_by == 'oldest') {
        sort = { "createdAt": 1 }
    }
    if (sort_by == 'price-asc') {
        sort = { "price": 1 }
    }
    if (sort_by == 'price-desc') {
        sort = { "price": -1 }
    }


    if (page) {
        pageOptions["page"] = parseInt(page == 0 ? 0 : page - 1, 10) || 0
    }


    Doctor.aggregate([
        { $match: data },
        { $skip: pageOptions.page * pageOptions.limit },
        { $limit: pageOptions.limit },
        { $sort: sort },
        {
            $lookup:
            {
                from: "doctorreviews",
                let: { id: '$_id' },
                pipeline: [
                    {
                        "$match": {
                            "$expr": {
                                "$and": [
                                    { "$eq": ["$doctor", '$$id'] },
                                ]
                            }
                        }
                    },
                ],
                as: "rating"
            }
        },
        {
            $lookup:
            {
                from: "countries",
                localField: "general.country",
                foreignField: "_id",
                as: "country"
            }
        },
        {
            $lookup:
            {
                from: "countries",
                localField: "general.city",
                foreignField: "_id",
                as: "city"
            }
        },
        {
            $lookup:
            {
                from: "departments",
                localField: "category",
                foreignField: "_id",
                as: "category"
            }
        },
        {
            $addFields: {
                ratingCount: { $size: "$rating" },
                average: { $avg: "$rating.rating" }
            }
        },
        { $project: { rating: 0 } },
    ]).exec(async (error, doctors) => {

        let count = await Doctor.countDocuments(data).exec()
        res.status(201).json({ success: true, doctors, categoryFetched, countryFetched, cityFetched, count })
        console.log(error);
    })



    // try {

    //     let count = await Doctor.countDocuments().exec()
    //     let doctors = await Doctor.find(data)
    //         .populate('category')
    //         .populate('general.city')
    //         .populate('general.country')
    //         .sort(sort)
    //         .skip(pageOptions.page * pageOptions.limit)
    //         .limit(pageOptions.limit)
    //         .exec()

    //     //console.log(products);
    //     res.status(201).json({ success: true, doctors, categoryFetched, countryFetched, cityFetched, count })

    // } catch (error) {
    //     console.log(error);
    //     res.status(400).json({ error: "something went wrong" })
    // }

})



//review-------------------------------------------------------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------------------------------
route.post("/review/create", (req, res) => {
    const { name, replyId, doctor, rating, comment } = req.body
    if (!name) {
        return res.status(400).json({ error: "name is required" })
    }
    if (!doctor) {
        return res.status(400).json({ error: "Doctor ID is required" })
    }
    let obj = {
        name,
        name,
        doctor,
        rating,
        comment
    }
    if (replyId) {
        obj.replyId = replyId
    }
    let _review = new DoctorReview(obj)

    _review.save()
        .then(review => {
            res.status(201).json({
                success: true,
                review
            })
        })
        .catch(err => {
            res.status(400).json({ error: "Something went wrong" })
        })
})
//------------------------------------------------------------------------------------------------------------------------------------------
const createReviewList = (reviews, replyId = null) => {
    const reviewList = []
    let review
    if (replyId == null) {
        review = reviews.filter(rev => rev.replyId == undefined)
    } else {
        review = reviews.filter(rev => rev.replyId == replyId)
    }
    for (let rev of review) {
        reviewList.push({
            _id: rev._id,
            name: rev.name,
            rating: rev.rating,
            comment: rev.comment,
            createdAt: rev.createdAt,
            replies: createReviewList(reviews, rev._id)
        })
    }
    return reviewList
}

route.get('/review/get/:doctorid', (req, res) => {
    let doctorId = req.params.doctorid


    DoctorReview.aggregate([
        { $match: { doctor: mongoose.Types.ObjectId(doctorId) } },
        {
            $group: {
                _id: "$rating",
                count: { $sum: 1 },
                totaStar: { $sum: { $multiply: [{ $sum: 1 }, "$rating"] } }
            }
        },
    ]).exec(async (error, result) => {
        let reviews = await DoctorReview.find({ doctor: doctorId })
            .sort('-createdAt')
            .limit(30)
            .exec()
        let reviewsCount = result.reduce((a, b) => +a + +b.count, 0);
        let totalStarCount = result.reduce((a, b) => +a + +b.totaStar, 0);
        let average = (totalStarCount / reviewsCount).toFixed(1)
        res.status(200).json({ success: true, reviewsStats: result, reviews: createReviewList(reviews), reviewsCount, average })
    })

})



route.get('/allreview', usersignin, (req, res) => {
    DoctorReview.find()
        .sort("-createdAt")
        .populate('doctor', 'general')
        .then(reviews => {
            res.status(200).json({ success: true, reviews })
        })
        .catch(err => {
            res.status(400).json({ error: "Something went wrong" })
        })
})


route.patch('/review/update/:reviewid', usersignin, (req, res) => {
    let reviewId = req.params.reviewid

    const { rating, comment } = req.body
    let data = {
        rating,
        comment
    }

    DoctorReview.findByIdAndUpdate(reviewId, { $set: data }, { new: true })
        .populate('doctor', 'general')
        .then(review => {
            res.status(200).json({ success: true, review })
        })
        .catch(err => {
            res.status(400).json({ error: "Something went wrong" })
        })
})


route.delete('/review/delete/:reviewid', usersignin, (req, res) => {
    let reviewId = req.params.reviewid

    DoctorReview.findByIdAndDelete(reviewId)
        .then(review => {
            res.status(200).json({ success: true })
        })
        .catch(err => {
            res.status(400).json({ error: "Something went wrong" })
        })

})

module.exports = route