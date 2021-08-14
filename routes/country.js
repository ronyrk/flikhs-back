const express = require('express')
const route = express.Router()
const slugify = require('slugify')
const Country = require('../model/countryCity.model')
const { usersignin, admin,moderator } = require('../middleware/auth.middleware')



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
route.post("/create", usersignin, moderator, (req, res) => {
    const { name, parentId } = req.body
    if (!name) {
        return res.status(400).json({ error: "name is required" })
    }
    let obj = {
        name,
        slug: slugify(name),
    }
    if (parentId) {
        obj.parentId = parentId
    }
    let _country = new Country(obj)

    _country.save()
        .then(country => {
            res.status(201).json({
                success: true,
                country
            })
        })
        .catch(err => {
            res.status(400).json({ error: "Something went wrong" })
        })
})


//---------------------------------------------------------------------------------------------------------------
route.get('/get', (req, res) => {
    Country.find()
        .sort("name")
        .then(country => {
            const countryList = createList(country)
            res.status(200).json({
                success: true,
                countries: countryList
            })
        })
        .catch(err => {
            res.status(400).json({ error: "Something went wrong" })
        })
})


//---------------------------------------------------------------------------------------------------------------
route.post("/edit/:id", usersignin, moderator, (req, res) => {
    const { name } = req.body
    let id = req.params.id
    if (!name || !id) {
        res.status(400).json({ error: "id and name is required" })
    }

    Country.findByIdAndUpdate(id, { $set: { name: name } }, { new: true })
        .then(country => {
            res.status(200).json({
                success: true,
                country
            })
        })
        .catch(err => {
            res.status(400).json({ error: "Something went wrong" })
        })
})


//---------------------------------------------------------------------------------------------------------------
route.delete('/delete/:id', usersignin, moderator, (req, res) => {
    let id = req.params.id
    if (!id) {
        res.status(400).json({ error: "id is required" })
    }

    Country.findByIdAndDelete(id)
        .then(country => {
            res.status(200).json({
                success: true,
            })
        })
        .catch(err => {
            res.status(400).json({ error: "Something went wrong" })
        })
})



module.exports = route