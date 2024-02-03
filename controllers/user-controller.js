const { User , Performance } = require("../models");
const { ErrorHandler } = require("../middlewares/errorHandling");
const {  performanceSchema } = require("../utils/joi_validations");

const getRandomText = async (req, res, next) => {
    try{
        const words = ['apple', 'book', 'cat', 'dog', 'and', 'flower', 'guitar', 'house', 'island', 'jungle', 'king', 'lion', 'mountain', 'notebook', 'ocean', 'pencil', 'queen', 'river', 'sun', 'tree', 'umbrella', 'vase', 'water', 'the', 'yacht', 'zebra', 'airplane', 'ball', 'car', 'dolphin', 'ear', 'fire', 'garden', 'hat', 'the', 'icecream', 'jacket', 'key', 'lemon', 'moon', 'nest', 'orange', 'piano', 'quilt', 'rain', 'star', 'table', 'unicorn', 'volcano', 'window', 'more', 'yogurt', 'the', 'ant', 'bee', 'caterpillar', 'duck', 'elephant', 'fish', 'giraffe', 'horse', 'insect', 'jellyfish', 'kangaroo', 'lion', 'monkey', 'nightingale', 'octopus', 'penguin', 'quail', 'rabbit', 'snake', 'tiger', 'umbrella', 'vulture', 'whale', 'the', 'yak', 'zebra', 'apple', 'banana', 'cherry', 'date', 'eggplant', 'fig', 'grape', 'honeydew', 'the', 'kiwi', 'lemon', 'mango', 'nectarine', 'orange', 'pear', 'quince', 'raspberry', 'a', 'tomato', 'more', 'vanilla', 'watermelon' , 'apple', 'book', 'cat', 'dog', 'and', 'flower', 'guitar', 'house', 'island', 'jungle', 'king', 'lion', 'mountain', 'notebook', 'ocean', 'pencil', 'queen', 'river', 'sun', 'tree', 'umbrella', 'vase', 'water', 'the', 'yacht', 'zebra', 'airplane', 'ball', 'car', 'dolphin', 'ear', 'fire', 'garden', 'hat', 'the', 'icecream', 'jacket', 'key', 'lemon', 'moon', 'nest', 'orange', 'piano', 'quilt', 'rain', 'star', 'table', 'unicorn', 'volcano', 'window', 'more', 'yogurt', 'the', 'ant', 'bee', 'caterpillar', 'duck', 'elephant', 'fish', 'giraffe', 'horse', 'insect', 'jellyfish', 'kangaroo', 'lion', 'monkey', 'nightingale', 'octopus', 'penguin', 'quail', 'rabbit', 'snake', 'tiger', 'umbrella', 'vulture', 'whale', 'the', 'yak', 'zebra', 'apple', 'banana', 'cherry', 'date', 'eggplant', 'fig', 'grape', 'honeydew', 'the', 'kiwi', 'lemon', 'mango', 'nectarine', 'orange', 'pear', 'quince', 'raspberry', 'a', 'tomato', 'more', 'vanilla', 'watermelon' , 'apple', 'book', 'cat', 'dog', 'and', 'flower', 'guitar', 'house', 'island', 'jungle', 'king', 'lion', 'mountain', 'notebook', 'ocean', 'pencil', 'queen', 'river', 'sun', 'tree', 'umbrella', 'vase', 'water', 'the', 'yacht', 'zebra', 'airplane', 'ball', 'car', 'dolphin', 'ear', 'fire', 'garden', 'hat', 'the', 'icecream', 'jacket', 'key', 'lemon', 'moon', 'nest', 'orange', 'piano', 'quilt', 'rain', 'star', 'table', 'unicorn', 'volcano', 'window', 'more', 'yogurt', 'the', 'ant', 'bee', 'caterpillar', 'duck', 'elephant', 'fish', 'giraffe', 'horse', 'insect', 'jellyfish', 'kangaroo', 'lion', 'monkey', 'nightingale', 'octopus', 'penguin', 'quail', 'rabbit', 'snake', 'tiger', 'umbrella', 'vulture', 'whale', 'the', 'yak', 'zebra', 'apple', 'banana', 'cherry', 'date', 'eggplant', 'fig', 'grape', 'honeydew', 'the', 'kiwi', 'lemon', 'mango', 'nectarine', 'orange', 'pear', 'quince', 'raspberry', 'a', 'tomato', 'more', 'vanilla', 'watermelon' , 'apple', 'book', 'cat', 'dog', 'and', 'flower', 'guitar', 'house', 'island', 'jungle', 'king', 'lion', 'mountain', 'notebook', 'ocean', 'pencil', 'queen', 'river', 'sun', 'tree', 'umbrella', 'vase', 'water', 'the', 'yacht', 'zebra', 'airplane', 'ball', 'car', 'dolphin', 'ear', 'fire', 'garden', 'hat', 'the', 'icecream', 'jacket', 'key', 'lemon', 'moon', 'nest', 'orange', 'piano', 'quilt', 'rain', 'star', 'table', 'unicorn', 'volcano', 'window', 'more', 'yogurt', 'the', 'ant', 'bee', 'caterpillar', 'duck', 'elephant', 'fish', 'giraffe', 'horse', 'insect', 'jellyfish', 'kangaroo', 'lion', 'monkey', 'nightingale', 'octopus', 'penguin', 'quail', 'rabbit', 'snake', 'tiger', 'umbrella', 'vulture', 'whale', 'the', 'yak', 'zebra', 'apple', 'banana', 'cherry', 'date', 'eggplant', 'fig', 'grape', 'honeydew', 'the', 'kiwi', 'lemon', 'mango', 'nectarine', 'orange', 'pear', 'quince', 'raspberry', 'a', 'tomato', 'more', 'vanilla', 'watermelon' , 'apple', 'book', 'cat', 'dog', 'and', 'flower', 'guitar', 'house', 'island', 'jungle', 'king', 'lion', 'mountain', 'notebook', 'ocean', 'pencil', 'queen', 'river', 'sun', 'tree', 'umbrella', 'vase', 'water', 'the', 'yacht', 'zebra', 'airplane', 'ball', 'car', 'dolphin', 'ear', 'fire', 'garden', 'hat', 'the', 'icecream', 'jacket', 'key', 'lemon', 'moon', 'nest', 'orange', 'piano', 'quilt', 'rain', 'star', 'table', 'unicorn', 'volcano', 'window', 'more', 'yogurt', 'the', 'ant', 'bee', 'caterpillar', 'duck', 'elephant', 'fish', 'giraffe', 'horse', 'insect', 'jellyfish', 'kangaroo', 'lion', 'monkey', 'nightingale', 'octopus', 'penguin', 'quail', 'rabbit', 'snake', 'tiger', 'umbrella', 'vulture', 'whale', 'the', 'yak', 'zebra', 'apple', 'banana', 'cherry', 'date', 'eggplant', 'fig', 'grape', 'honeydew', 'the', 'kiwi', 'lemon', 'mango', 'nectarine', 'orange', 'pear', 'quince', 'raspberry', 'a', 'tomato', 'more', 'vanilla', 'watermelon'];
        
        const text = [];
        for(i=0;i<50;i++){
            text.push(words[Math.floor(Math.random() * words.length)]);
        }
        res.status(200).json({
            success : true,
            text : text
        })
    }catch(err){
        next(err)
    }
}

const getRandomTextIncludingPunctuation = async (req, res, next) => {
    try{
        const punctuations = ["The", "people", "with", "ideas", "have", "no", "power", "and", "the", "people", "with", "power", "have", "no", "ideas", ".","You", "must", "take", "life", "the", "way", "it", "comes", "at", "you", "and", "make", "the", "best", "of", "it", ".","If", "you", "don't", "know", "what", "you", "want", ",", "how", "are", "you", "going", "to", "know", "when", "you", "get", "it", "?","If", "you", "have", "to", "ask", ",", "you", "will", "never", "know", ".", "If", "you", "know", ",", "you", "need", "only", "ask", ".","Your", "memory", "is", "the", "glue", "that", "binds", "your", "life", "together", ".","I'm", "sure", "there", "are", "things", "you", "know", "that", "you", "don't", "even", "know", "you", "know", ".","You", "can't", "use", "the", "fire", "exit", "because", "you're", "not", "made", "of", "fire", ".","The", "person", "that", "has", "the", "most", "to", "do", "with", "what", "happens", "to", "you", "is", "you", "!" , "The", "people", "with", "ideas", "have", "no", "power", "and", "the", "people", "with", "power", "have", "no", "ideas", ".","You", "must", "take", "life", "the", "way", "it", "comes", "at", "you", "and", "make", "the", "best", "of", "it", ".","If", "you", "don't", "know", "what", "you", "want", ",", "how", "are", "you", "going", "to", "know", "when", "you", "get", "it", "?","If", "you", "have", "to", "ask", ",", "you", "will", "never", "know", ".", "If", "you", "know", ",", "you", "need", "only", "ask", ".","Your", "memory", "is", "the", "glue", "that", "binds", "your", "life", "together", ".","I'm", "sure", "there", "are", "things", "you", "know", "that", "you", "don't", "even", "know", "you", "know", ".","You", "can't", "use", "the", "fire", "exit", "because", "you're", "not", "made", "of", "fire", ".","The", "person", "that", "has", "the", "most", "to", "do", "with", "what", "happens", "to", "you", "is", "you", "!"]
        
        const text = [];
        for(i=0;i<50;i++){
            const randomIndex = Math.floor(Math.random() * punctuations.length);
            if(i==0 && (punctuations[randomIndex] == "." || punctuations[randomIndex] == "," ||
            punctuations[randomIndex] == "!" || punctuations[randomIndex] == "?")){
                continue;
            }
            text.push(punctuations[randomIndex]);
        }
        res.status(200).json({
            success : true,
            text : text
        });
    }catch(err){
        next(err)
    }
}

// const getRandomTextIncludingNumbers = async (req, res, next) => {
//     try{
        
//     }catch(err){
//         next(err)
//     }
// }

const updateUsername = async (req, res, next) => {
    try{
        const { username } = req.body;
        const existingUsername = await User.findOne({where : { username : username }});
        if(existingUsername){
            return next(new ErrorHandler(400 , "This username already taken by someone else"));
        }
        
        const id = req.user._id;
        const user = await User.findOne({where : { _id : id }});
        if(user){
            user.username = username;
            await user.save();
            res.status(200).json({
                success : true,
                message : "Username updated successfully"
            })
        }else{
            return next (new ErrorHandler(400 , "No user found"));
        }
    }catch(err){
        next(err)
    }
}

const getUser = async (req, res, next) => {
    try{
        const id = req.user._id;
        const user = await User.findOne({where : { _id : id }});
        if(!user){
            return next (new ErrorHandler(400 , "No user found"));
        }

        const data = {
            username : user.username,
            email : user.email,
            isVerified : user.isVerified
        }
        res.status(200).json({
            success : true,
            message : "User found",
            data : data
        });
    }catch(err){
        next(err)
    }
}

const savePerformance = async (req, res, next) => {
    try{
        const id = req.user._id;
        console.log(id);
        const user = await User.findOne({where : { _id : id }});
        if(!user){
            return next (new ErrorHandler(400 , "No user found"));
        }
        const data = await performanceSchema.validateAsync(req.body);
        const { wpm , accuracy , timing , raw , correct , incorrect , extra , missed } = data;

        const newPerformance = await Performance.create({
            wpm,
            accuracy,
            timing,
            raw,
            correct,
            incorrect,
            extra,
            missed,
            userId: id
        });

        res.status(201).json({
            success: true,
            message: "Performance saved successfully",
            performance: newPerformance,
        });   
    }catch(err){
        next(err)
    }
}

const getPerformances = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const user = await User.findOne({ where: { _id: userId } });
        if (!user) {
            return next(new ErrorHandler(404, "User not found"));
        }

        const performances = await user.getPerformances();
        if(!performances){
            return next(new ErrorHandler(404, "No performances found"));
        }

        res.status(200).json({
            success: true,
            performances,
        });
    } catch (err) {
        next(err);
    }
};


module.exports = {
    getRandomText,
    getRandomTextIncludingPunctuation,
    updateUsername,
    getUser,
    savePerformance,
    getPerformances
}