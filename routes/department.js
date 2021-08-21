const express = require('express')
const route = express.Router()
const slugify = require('slugify')
const Department = require('../model/department.model')
const { usersignin, admin,moderator } = require('../middleware/auth.middleware')




//---------------------------------------------------------------------------------------------------------------
route.post("/create", usersignin, moderator, async (req, res) => {
    const { name, image ,isFeatured} = req.body
    if (!name) {
        return res.status(400).json({ error: "name is required" })
    }
    let obj = {
        name,
        slug: slugify(name),
        image,
        isFeatured
    }
   
    let _department = new Department(obj)

    let isDeptExists = await Department.findOne({slug:slugify(name)})
    if(isDeptExists){
        return  res.status(400).json({ error: "Deparment already exists" })
    }

    _department.save()
        .then(department => {
            res.status(201).json({
                success: true,
                department
            })
        })
        .catch(err => {
            console.log(err);
            res.status(400).json({ error: "Something went wrong" })
        })
})


//---------------------------------------------------------------------------------------------------------------
route.get('/get', (req, res) => {
    Department.find()
        .then(departments => {
            
            res.status(200).json({
                success: true,
                departments
            })
        })
        .catch(err => {
            res.status(400).json({ error: "Something went wrong" })
        })
})


//---------------------------------------------------------------------------------------------------------------
route.patch("/edit/:id", usersignin, moderator, (req, res) => {
    const { name,image,isFeatured } = req.body
    let id = req.params.id
    if (!name || !id) {
        res.status(400).json({ error: "id and name is required" })
    }

    let data ={
        name,
        isFeatured
    }

    if(image){
        data.image = image
    }

    Department.findByIdAndUpdate(id, { $set: data }, { new: true })
        .then(department => {
            res.status(200).json({
                success: true,
                department
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

    Department.findByIdAndDelete(id)
        .then(department => {
            res.status(200).json({
                success: true,
            })
        })
        .catch(err => {
            res.status(400).json({ error: "Something went wrong" })
        })
})



module.exports = route