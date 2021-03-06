const express = require('express');
const router = express.Router();
const request = require('request');
const config = require('config');
const auth = require('../../middleware/auth');
const {check, validationResult} = require('express-validator');

const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route    GET api/profile/me
// @desc     Get current users profile
// @access   Private
router.get('/me', auth, async (req, res) => {
    try {
      const profile = await Profile.findOne({
        user: req.user.id
      }).populate('user', ['name', 'avatar']);
  
      if (!profile) {
        return res.status(400).json({ msg: 'There is no profile for this user' });
      }
  
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });

//@route    Post api/profile/me
//@desc     Create or update a profile
//@access   Private

router.post('/', [
    auth, 
    [check('status', 'Status is required').not().isEmpty(),
    check('skills', 'Skills are required').not().isEmpty()]
],
 async (req, res) => {

    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }

    const {
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube, facebook, twitter,instagram,linkedin
    } = req.body;

    //Build profile object

    const profileFeilds = {};
    profileFeilds.user = req.user.id;
    if(company) profileFeilds.company = company;
    if(website) profileFeilds.website = website;
    if(location) profileFeilds.location = location;
    if(bio) profileFeilds.bio = bio;
    if(status) profileFeilds.status = status;
    if(githubusername) profileFeilds.githubusername = githubusername;
    if(skills) {

        profileFeilds.skills = skills.split(',').map(skill => skill.trim());
        
    }

    //build social object
    profileFeilds.social ={};

    if(youtube) profileFeilds.social.youtube = youtube;
    if(twitter) profileFeilds.social.twitter = twitter;
    if(facebook) profileFeilds.social.facebook = facebook;
    if(linkedin) profileFeilds.social.linkedin = linkedin;
    if(instagram) profileFeilds.social.instagram = instagram;

    try{
        let profile = await Profile.findOne({ user: req.user.id});

        if(profile) {

            //update
            profile= await Profile.findOneAndUpdate(
            {user: req.user.id}, {$set: profileFeilds}, {new: true});
            return res.json(profile);
        }

        //create 

        profile = new Profile(profileFeilds);

        await profile.save();
        res.json(profile);
    }

    catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error');

    }
    

});


//@route    DELETE api/profile/me
//@desc     delete profile , user and posts
//@access   Private
router.delete('/me', auth, async (req, res) => {

    try {

        //@todo - remove users posts


        // Remove profile
        await Profile.findOneAndRemove({ user: req.user.id}).res.json(profiles);

        //Remove user
        await User.findOneAndRemove({ _id: req.user.id}).res.json(profiles);
        res.json({msg: ' User deleted'});

        }
    catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error');

    }
});

//@route    Get api/profile
//@desc     Get all profiles
//@access   Public

router.get('/', async (req,res) => {

    try {

        const profiles = await Profile.find().populate('user', ['name','avatar']);
        res.json(profiles);

    }

    catch(err){

        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

//@route    Get api/profile/user/:user_id
//@desc     Get profile by user Id
//@access   Public

router.get('/user/:user_id', async (req,res) => {

    try {

        const profile = await Profile.findOne({user: req.params.user_id}).populate('user', ['name','avatar']);
        
        if(!profile) return res.status(400).json({msg: 'Profile not found'})        
        res.json(profile);

    }

    catch(err){

        console.error(err.message);
        if(err.kind = 'ObjectId') {
            return res.status(400).json({msg: 'Profile not found'}) 
        }
        res.status(500).send("Server Error");
    }
});

//@route    Delete api/profile
//@desc     Delete profile, user and posts
//@access   Private

router.delete('/', auth, async (req,res) => {

    try {

        // @todo remove users post

        //remove profile
        await Profile.findOneAndRemove({user: req.user.id});
        //remove user
        await User.findOneAndRemove({_id: req.user.id});
                
        res.json({msg: 'User deleted'});

    }

    catch(err){

        console.error(err.message);
        if(err.kind = 'ObjectId') {
            return res.status(400).json({msg: 'Profile not found'}) 
        }
        res.status(500).send("Server Error");
    }
});

//@route    Put api/profile/experience
//@desc     Add profile experience
//@access   Private

router.put('/experience', [auth,[
    check('title', 'Title is required').not().isEmpty(),
    check('company', 'Company is required').not().isEmpty(),
    check('from', 'From date is required').not().isEmpty()]],

     async (req, res) => {
         const errors = validationResult(req);
         if(!errors.isEmpty()) {
             return res.status(400).json({errors:errors.array()});
         }

        const {
            title,
            company,
            location,
            from,
            to,
            current,
            description
            } = req.body;
        
        const newExp = {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        }

        try {
            const profile = await Profile.findOne({user: req.user.id});
            profile.experience.unshift(newExp);

            await profile.save();

            res.json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error')
            
        }
});


//@route    Delete api/profile/experience/:exp_id
//@desc     Delete experience from profile
//@access   Private

router.delete('/experience/:exp_id', auth, async(req,res) => {
    try {

        const profile = await Profile.findOne({user: req.user.id});

        //Get remove index

        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);
        profile.experience.splice(removeIndex, 1);
        await profile.save();
        res.json(profile);        
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
        
    }
});

//@route    Put api/profile/education
//@desc     Add profile education
//@access   Private

router.put('/education', [auth,[
    check('school', 'School is required').not().isEmpty(),
    check('degree', 'Degree is required').not().isEmpty(),
    check('fieldofstudy', 'Field of study is required').not().isEmpty()]],

     async (req, res) => {
         const errors = validationResult(req);
         if(!errors.isEmpty()) {
             return res.status(400).json({errors:errors.array()});
         }

        const {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description
            } = req.body;
        
        const newEdu = {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description
        }

        try {
            const profile = await Profile.findOne({user: req.user.id});
            profile.education.unshift(newEdu);

            await profile.save();

            res.json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error')
            
        }
});


//@route    Delete api/profile/education/:edu_id
//@desc     Delete education from profile
//@access   Private

router.delete('/education/:exp_id', auth, async(req,res) => {
    try {

        const profile = await Profile.findOne({user: req.user.id});

        //Get remove index

        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);
        profile.education.splice(removeIndex, 1);
        await profile.save();
        res.json(profile);        
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
        
    }
});

//@route    Get api/profile/github/:username
//@desc     Get user repos from Github
//@access   Public

router.get('/github/:username', (req,res) => {

    try {

        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secert=${config.get('githubSecert')}`,
            method: 'GET',
            headers: {'user-agent': 'node.js'}
        };

        request(options, (error, response,body) => {
            if(error) console.error(error);

            if(response.statusCode !== 200) {

                return res.status(404).json({msg: 'No profile found'});
            }

            res.json(JSON.parse(body));
        });
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
        
    }
})



module.exports =router;     