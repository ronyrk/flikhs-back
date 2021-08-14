const express = require('express')
const route = express.Router()
const slugify = require('slugify')
const Country = require('../model/countryCity.model')
const Department = require('../model/department.model')
const Doctor = require('../model/doctor.model')
const { usersignin, admin, moderator } = require('../middleware/auth.middleware')

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

// {
//     "general":{
//        "name":"Md shimul",
//        "title":"this is a demo title",
//        "gender":"male",
//        "age":"25 - 30",
//        "country":"610e1770057c8655f823b9c3",
//        "city":"610e1778057c8655f823b9c4",
//        "address":"99/6,Nasiruddin sardar len,Sutrapur, Dhaka",
//        "zip":"457",
//        "phone":"03454534534",
//        "website":"http://localhost:4000/add-doctor",
//        "newPatient":"true",
//        "teleHealth":"true"
//     },
//     "about":"<p>fdhh</p>",
//     "education":[
//        {
//           "academyName":"gr",
//           "academyAddress":"99/6,Nasiruddin sardar len,Sutrapur, Dhaka",
//           "from":"2003",
//           "to":"2002"
//        }
//     ],
//     "hospital":[
//        {
//           "hospitalName":"sad",
//           "hospitalAddress":"99/6,Nasiruddin sardar len,Sutrapur, Dhaka",
//           "call":"fdgfg",
//           "from":"10",
//           "fromFormat":"am",
//           "to":"",
//           "toFormat":"",
//           "cal":"h"
//        }
//     ],
//     "experience":[
//        {
//           "academyName":"gr",
//           "academyAddress":"99/6,Nasiruddin sardar len,Sutrapur, Dhaka",
//           "from":"2003",
//           "to":""
//        }
//     ],
//     "language":[
//        "English"
//     ],
//     "social":[
//        {
//           "socialLink":"http://localhost:3000/add-doctor",
//           "socialName":"Instagram"
//        }
//     ],
//     "category":[
//        "610e25a3ca7941428ce6f692"
//     ],
//     "profileImage":"https://res.cloudinary.com/shimul/image/upload/v1628788556/gecuuohp55ggdexv3hfq.jpg"
//  }

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
        profileImage
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

route.get('/getall/:type', usersignin, admin, (req, res) => {
    let type = req.params.type
    Doctor.find({ isApproved: type === 'pending' ? false : true })
        .then(doctors => {
            res.status(201).json({ success: true, doctors })
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

route.get('/singledoctor/:id', (req, res) => {
    let id = req.params.id
    Doctor.findById(id)
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

    }



    if (category) {
        let fetchedCategory = await Department.findOne({ slug: category }).exec()
        if (fetchedCategory) {
            data.category = fetchedCategory._id
            categoryFetched = fetchedCategory
        }

    }
    if (country) {
        let fetchedCountry = await Country.findOne({ slug: country }).exec()
        if (fetchedCountry) {
            data["general.country"] = fetchedCountry._id
            countryFetched = fetchedCountry
        }

    }
    if (city) {
        let fetchedCity = await Country.findOne({ slug: city }).exec()
        if (fetchedCity) {
            data["general.city"] = fetchedCity._id
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



    try {

        let count = await Doctor.countDocuments().exec()
        let doctors = await Doctor.find(data)
            .populate('category')
            .populate('general.city')
            .populate('general.country')
            .sort(sort)
            .skip(pageOptions.page * pageOptions.limit)
            .limit(pageOptions.limit)
            .exec()
          
        //console.log(products);
        res.status(201).json({ success: true, doctors, categoryFetched, countryFetched, cityFetched ,count})

    } catch (error) {
        console.log(error);
        res.status(400).json({ error: "something went wrong" })
    }

})


module.exports = route