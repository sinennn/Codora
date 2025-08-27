//solo
import { useState, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Button } from "../../components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "../../components/ui/toggle-group";
import { BookOpen, Clock, Settings, ChevronRight, List } from "lucide-react";  
import { toast } from '../../components/ui/toast';
import fieldsData from "../../Data/Fields.json";
import techData from "../../Data/Technologies.json";
import { ClipLoader } from 'react-spinners'; 
import { generateQuizQuestions } from '../../Services/aiService';
import useSendBack from "../../Services/sendBack";

interface QuizParams {
  topic: string;
  optionType: 'field' | 'technology';
  difficulty: string;
  numberOfQuestions: number;
}

export default function Index() {
    useSendBack();
  const navigate = useNavigate();
  const [optionType, setOptionType] = useState<'field' | 'technology'>('field');
  const [selectedOption, setSelectedOption] = useState("");
  const [quizDuration, setQuizDuration] = useState(10);
  const [difficulty, setDifficulty] = useState("Starter");
  const [Spinning, isSpinning] = useState(false)
  const [numberOfQuestions, setNumberOfQuestions] = useState(10);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  const options = useMemo(() => {
    setIsLoadingOptions(true);
    const result = optionType === 'field' 
      ? fieldsData.fields
      : techData;
    setIsLoadingOptions(false);
    return result;
  }, [optionType]);

  const handleStartQuiz = async () => {
    isSpinning(true);
    if (!selectedOption) {
      toast.error('Please select a field/technology');
      isSpinning(false);
      return;
    }
  
    try {
      // Prepare quiz parameters
      const quizParams: QuizParams = {
        topic: selectedOption,
        optionType: optionType,
        difficulty: difficulty,
        numberOfQuestions: numberOfQuestions
      };
  
      // Generate quiz questions using AI service
      const result = await generateQuizQuestions(quizParams);
      const questions = result.questions;
      const rawResponse = result.rawResponse;
      
      // Verify we have questions before proceeding
      if (!questions || questions.length === 0) {
        throw new Error('No questions were generated');
      }
      
      // Navigate to quiz page with questions and raw response
      navigate('/SoloQuiz', { 
        state: { 
          questionData: questions.map(q => ({
            question: q.question,
            options: q.options.map((option, index) => ({
              text: option,
              isCorrect: index === q.correctAnswer
            })),
            explanation: q.explanation
          })),
          quizTime: quizDuration * 60,
          rawResponse: rawResponse
        }
      });
       
      console.log(`Quiz generated successfully! ${questions.length} questions ready.`);
    } catch (error) {
      console.error('Error generating quiz:', error);
      toast.error(`Network Error, please try again`);
      isSpinning(false);
    } finally {
         isSpinning(false);
    }
  };



  return (
      <div className="w-screen h-screen flex justify-center items-center bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden animate-fade-in px-4 sm:px-8 ">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-700/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>

          <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl border-none ">
              <CardHeader className="pb-2">
                  <CardTitle className="text-3xl font-extrabold text-center bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
                      Set Up Your Solo Quiz
                  </CardTitle>
                  <CardDescription className="text-gray-400 text-center pt-2">
                      Customize your quiz experience
                  </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 pt-4">
                  <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                          <Settings className="h-4 w-4 text-orange-500" />
                          Quiz Type
                      </label>
                      <ToggleGroup type="single" value={optionType} onValueChange={(value) => value && setOptionType(value as 'field' | 'technology')} className="justify-center">
                          <ToggleGroupItem value="field" className="bg-gray-800 data-[state=on]:bg-orange-500 data-[state=on]:text-white text-gray-300 hover:bg-gray-700 border-gray-700 px-5">
                              Field
                          </ToggleGroupItem>
                          <ToggleGroupItem value="technology" className="bg-gray-800 data-[state=on]:bg-orange-500 data-[state=on]:text-white text-gray-300 hover:bg-gray-700 border-gray-700 px-5">
                              Technology
                          </ToggleGroupItem>
                      </ToggleGroup>
                  </div>

                  <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-orange-500" />
                          Select {optionType}
                      </label>
                      <Select 
                          value={selectedOption} 
                          onValueChange={setSelectedOption}
                      >
                          <SelectTrigger className="w-full bg-gray-800 text-white border-gray-700 focus:ring-orange-500 focus:ring-opacity-50 h-11">
                              <SelectValue placeholder={`Choose a ${optionType}`} />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700 text-white">
                              {isLoadingOptions ? (
                                  <div className="p-4 text-center text-gray-400">Loading options...</div>
                              ) : (
                                  options.map((opt) => (
                                      <SelectItem key={opt.id} value={opt.name} className="focus:bg-gray-700">
                                          {opt.name}
                                      </SelectItem>
                                  ))
                              )}
                          </SelectContent>
                      </Select>
                  </div>

                  <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-orange-500" />
                          Quiz Duration (minutes)
                      </label>
                      <Select 
                          value={quizDuration.toString()} 
                          onValueChange={(value) => setQuizDuration(parseInt(value))} 
                      >
                          <SelectTrigger className="w-full bg-gray-800 text-white border-gray-700 focus:ring-orange-500 focus:ring-opacity-50 h-11">
                              <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700 text-white">
                              {[5, 10, 15, 20, 30].map((min) => (
                                  <SelectItem key={min} value={min.toString()} className="focus:bg-gray-700">
                                      {min} minutes
                                  </SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>

                  <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                          <Settings className="h-4 w-4 text-orange-500" />
                          Select Difficulty
                      </label>
                      <Select 
                          value={difficulty} 
                          onValueChange={setDifficulty}
                      >
                          <SelectTrigger className="w-full bg-gray-800 text-white border-gray-700 focus:ring-orange-500 focus:ring-opacity-50 h-11">
                              <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700 text-white">
                              {['Starter', 'Intermediate Dev', '10x Engineer'].map((level) => (
                                  <SelectItem key={level} value={level} className="focus:bg-gray-700">
                                      {level}
                                  </SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>

                  {/* Number of Questions Field */}
                  <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                          <List className="h-4 w-4 text-orange-500" /> {/* Added List Icon */}
                          Number of Questions
                      </label>
                      <Select 
                          value={numberOfQuestions.toString()} 
                          onValueChange={(value) => setNumberOfQuestions(parseInt(value))}
                      >
                          <SelectTrigger className="w-full bg-gray-800 text-white border-gray-700 focus:ring-orange-500 focus:ring-opacity-50 h-11">
                              <SelectValue placeholder="Select number of questions" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700 text-white">
                              {[5, 10, 15, 20, 25].map((num) => (
                                  <SelectItem key={num} value={num.toString()} className="focus:bg-gray-700">
                                      {num} Questions
                                  </SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
              </CardContent>

              <CardFooter className="pt-4">
                  <Button 
                      onClick={handleStartQuiz}
                      className="w-full py-6 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-all duration-300 group shadow-md shadow-orange-500/20"
                  >
                      {Spinning ? (
              <ClipLoader color="#ffffff" size={22} cssOverride={{ borderWidth: '4px' }} />
            ) : (
              <>
               <span>Start Quiz</span>
                      <ChevronRight className="ml-1 group-hover:translate-x-1 transition-transform" />
              </>
            )}
                  </Button>
              </CardFooter>
          </div>
      </div>
  );
}
