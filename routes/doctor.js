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
const puppeteer = require('puppeteer');
const districts = require('../assets/districts.json')

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
        let departments = await Department.find().sort('name').exec()

        res.status(200).json({ countries, departments })
    } catch (error) {
        res.status(400).json({ error: "Something went wrong" })
    }
})



//---------------------------------------------------------------------------------------------------------------

route.post("/create", (req, res) => {
    let { general, about, education, hospital, affiliatedHospital, experience, language, social, category, profileImage } = req.body

    if (!general.name) {
        return res.status(400).json({ error: "Name is required" })
    }

    let data = {
        general,
        about,
        education,
        hospital,
        affiliatedHospital,
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
    let { general, about, education, hospital, affiliatedHospital, experience, language, social, category, profileImage, isApproved } = req.body
    let id = req.params.id
    if (!general.name) {
        return res.status(400).json({ error: "Name is required" })
    }

    let data = {
        general,
        about,
        education,
        hospital,
        affiliatedHospital,
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
    let { specialist: category, country, city, page, sort_by, limit } = req.body
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



route.post('/datascrap/healthgrade', async (req, res) => {
    if (!req.body.url) {
        return res.status(400).json({ error: "Url is required" })
    }
    try {
        const browser = await puppeteer.launch({
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
            ],
        });


        const page = await browser.newPage()
        await page.goto(req.body.url)
        let name = await page.evaluate(() => {
            return document.querySelector('h1[data-qa-target="ProviderDisplayName"]')?.textContent
        })
        let category = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('#about-me-section section[data-qa-target="about-me-specialties"] ul > li > span')).map(x => x?.textContent)
        })
        let language = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('#about-me-languages > div > ul > li > span')).map(x => x?.textContent)
        })
        let gender = await page.evaluate(() => {
            return document.querySelector('span.summary-header-row-gender-age span[data-qa-target="ProviderDisplayGender"]')?.textContent
        })
        let age = await page.evaluate(() => {
            return document.querySelector('span.summary-header-row-gender-age span[data-qa-target="ProviderDisplayAge"]')?.textContent
        })
        let address = await page.evaluate(() => {
            let parent = document.querySelector('.address')
            // console.log(parent);



            if (parent) {
                let hospitalName = parent.querySelector('a')?.textContent
                let otherAddress = Array.from(parent?.querySelectorAll('span')).map(x => x?.textContent)
                let streetAddress = Array.from(parent?.querySelectorAll('span.street-address')).map(x => x?.textContent)
                return {
                    hospitalName,
                    streetAddress,
                    otherAddress
                }
            }

        })



        // await page.click('#summary-section > div.standard-summary-2-width-container > div.hg-right-bar-layout > div > div > div.summary-standard-2-badges-desktop > div.summary-standard-2-button-row > a')

        let phone = await page.evaluate(() => {
            document.querySelector('#summary-section > div.hg-right-bar-layout > div > div.inline-contact-container.inline-contact-container-specialty > div.summary-column.location-container > div.summary-standard-button-row > a')?.click()
            let num1 = document.querySelector('div[data-qa-target="new-number"]')?.textContent || null
            let num2 = document.querySelector('#summary-section > div.hg-right-bar-layout > div > div.inline-contact-container.inline-contact-container-specialty > div.summary-column.location-container > div.summary-standard-button-row > a')?.textContent
            let num3 = document.querySelector('#summary-section > div.standard-summary-2-width-container > div.hg-right-bar-layout > div > div > div.summary-standard-2-badges-desktop > div.summary-standard-2-button-row > a')?.textContent

            return num1 || num2 || num3


        })


        let newPatient = await page.evaluate(() => {
            return Boolean(document.querySelector('#first-sidebar-container > div:nth-child(1) > div > div > span')?.textContent)

        })
        let profileImage = await page.evaluate(() => {
            return document.querySelector('#summary-section img')?.src

        })


        //await page.click('.about-me-bio-read-more')

        // page.evaluate(async () => {
        //     await Promise.all([
        //         page.click(".about-me-bio-read-more"),
        //         //The page.waitFor is set to 15000 for my personal use. 
        //         //Feel free to play around with this.
        //        // page.waitFor(15000)
        //     ]);
        // });

        let about = await page.evaluate(async () => {
            //Array.from(document.querySelectorAll('.about-me-bio-read-more')).map(x=>x?.click())
            return document.querySelector('p[data-qa-target="premium-biography"]')?.textContent
        })

        const education = await page.evaluate(() => {
            let cards = document.querySelectorAll('#about-me-section > div:nth-child(4) > div > section > div > div > div > div > div > div > div.education-card-content')

            let array = Promise.all(Array.from(cards).map((card) => {
                let value = {}
                let from = card.querySelector('.timeline-date')?.textContent
                let academyName = card.querySelector('.education-name')?.textContent
                let academyAddress = card.querySelector('.education-completed')?.textContent
                if (from) {
                    value.from = from
                }
                if (academyName) {
                    value.academyName = academyName
                }
                if (academyAddress) {
                    value.academyAddress = academyAddress
                }

                return value
            }))

            return array
        })


        const hospital = await page.evaluate(() => {
            let cards = document.querySelectorAll('#premium-hospital-section > section.profile-subsection > section.hospital-card > div:nth-child(1)')

            let array = Promise.all(Array.from(cards).map((card) => {
                let value = {}
                let hospitalName = card.querySelector('.hospital-name span[data-qa-target="hospital-name"]')?.textContent
                let hospitalAddress = card.querySelector('.hospital-location')?.textContent

                if (hospitalName) {
                    value.hospitalName = hospitalName
                }
                if (hospitalAddress) {
                    value.hospitalAddress = hospitalAddress
                }

                return value
            }))

            return array
        })


        browser.close()
        res.status(200).json({ success: true, name, category, gender, address, phone, newPatient, about, education, language, profileImage, age, hospital })
    } catch (error) {
        console.log(error);
        res.status(400).json({ error: "Something went wrong" })
    }
})


route.post('/datascrap/doctorbn', async (req, res) => {
    if (!req.body.url) {
        return res.status(400).json({ error: "Url is required" })
    }
    try {

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox','--disable-setuid-sandbox']
          });


        // const browser = await puppeteer.launch({
        //     executablePath: '/usr/bin/chromium-browser'
        //   });



        const page = await browser.newPage()
        await page.goto(req.body.url)
        let name = await page.evaluate(() => {
            return document.querySelector('header.entry-header > div.info > h1')?.textContent
        })
        let firstChamberText = await page.evaluate(() => {
            return document.querySelector('body > div > div.site-inner > div > main > article > div > p:nth-child(3)')?.textContent
        })


        let title = await page.evaluate(() => {
            return document.querySelector(' header.entry-header > div.info > ul > li:nth-child(1)')?.textContent
        })
        
        let category = await page.evaluate(() => {
            let cats = document.querySelector('header.entry-header > div.info > ul > li.speciality')?.textContent
            return cats?.split(",")
        })
        
        let city = districts.map(x=>firstChamberText?.search(new RegExp(x, "i")) !== -1 && x )?.find(x=>x)
        
        let address = await page.evaluate(() => {
            return document.querySelector(' div.site-inner > div > main > article > header > div.info > ul > li:nth-child(3)')?.textContent
        })


        let phone = await page.evaluate(() => {
            return document.querySelector(' body > div > div.site-inner > div > main > article > div > p:first-of-type > a.call-now')?.href
        })


        let about = await page.evaluate(() => {
            return document.querySelector('div.site-inner > div > main > article > div.entry-content > p:last-of-type')?.textContent
        })
        let profileImage = await page.evaluate(() => {
            return document.querySelector('body > div > div.site-inner > div > main > article > header > div.photo > img')?.src
        })


        let hospital = await page.evaluate(() => {
            let chambers =  document.querySelectorAll('div.site-inner > div > main > article > div.entry-content > p:not(:last-of-type):not(.free)')
            if(chambers?.length === 0) return 
            
            let array = Promise.all(Array.from(chambers).map(async (chamber) => {
                let fullText = chamber?.textContent
                let htmlArray = chamber?.innerHTML?.split("<br>")
                let value = {
                    
                }
                let hospitalName = chamber?.querySelector('strong > a').textContent?.split(",")[0]
                let hospitalAddress = htmlArray.find(x=>x.includes("Address"))?.replace("Address:","")?.trim()
                let visitingHourText = htmlArray.find(x=>x.includes("Visiting Hour"))?.replace("Visiting Hour:","")?.trim()
                let call = chamber?.querySelector('a.call-now').href
                
                if (hospitalName) {
                    value.hospitalName = hospitalName
                }
                if (hospitalAddress) {
                    value.hospitalAddress = hospitalAddress
                }

                if(visitingHourText){
                    let range = visitingHourText.split("(")[0]?.split("to")?.map(x=>x?.trim())
                    if(range[0]){
                        value = {
                            ...value,
                            from:range[0].match(/\d+/g)[0]||"",
                            fromFormat:range[0].match(/[a-zA-Z]+/g)[0]||"",
                        }
                    }

                    if(range[1]){
                        value = {
                            ...value,
                            to:range[1].match(/\d+/g)[0]||"",
                            toFormat:range[1].match(/[a-zA-Z]+/g)[0]||"",
                        }
                    }
                   
                }

                if(call){
                    value.call = call?.replace("tel:+88","")
                }
     

                return value
            }))

            return array
        })

       

      
        res.status(200).json({
            success:true,
            name,
            title,
            category,
            city,
            address,
            phone:phone?.replace("tel:+88","")||"",
            about,
            profileImage,
            hospital
        })

    } catch (error) {
        console.log(error);
        res.status(400).json({ error: "Something went wrong" })
    }
})

module.exports = route


