import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash, MagicWand } from '@phosphor-icons/react';
import { useToast } from '@/hooks/use-toast';
import { Question, QuizReward } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export default function AdminQuizCreate() {
  const { user, hydrated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id: quizId } = useParams();
  const isEditMode = !!quizId;
  
  // Redirect if not admin (after hydration)
  React.useEffect(() => {
    if (hydrated && !user?.isAdmin) {
      navigate('/home');
    }
  }, [hydrated, user?.isAdmin, navigate]);

  if (!hydrated) return null;
  if (!user?.isAdmin) return null;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    entryFee: 500,
    totalPrizeAmount: 5000,
    numberOfQuestions: 5,
    penaltyAmount: 50
  });

  const [questions, setQuestions] = useState<Partial<Question>[]>([
    { text: '', options: ['', '', '', ''], correctOption: 0, timeLimit: 30 }
  ]);

  const [rewards, setRewards] = useState<QuizReward[]>([
    { questionNumber: 1, correctReward: 50 }
  ]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [isLoading, setIsLoading] = useState(isEditMode);

  // Load quiz data when in edit mode
  React.useEffect(() => {
    if (isEditMode && quizId) {
      loadQuizData();
    }
  }, [isEditMode, quizId]);

  const loadQuizData = async () => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (error) throw error;

      if (data) {
        const startTime = new Date(data.start_time);
        const endTime = new Date(data.end_time);
        
        setFormData({
          title: data.title,
          description: data.description || '',
          category: '', // Add category to DB if needed
          entryFee: data.entry_fee,
          totalPrizeAmount: data.prize_pool,
          numberOfQuestions: (data.questions as any)?.length || 5,
          penaltyAmount: data.penalty_amount
        });

        if (data.questions) {
          setQuestions(data.questions as any);
        }

        if (data.reward_progression) {
          setRewards(data.reward_progression as any);
        }
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
      toast({
        title: "Load Failed",
        description: "Failed to load quiz data.",
        variant: "destructive"
      });
      navigate('/admin/quizzes');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate progressive rewards automatically
  React.useEffect(() => {
    const newRewards: QuizReward[] = [];
    const baseReward = Math.floor(formData.totalPrizeAmount / formData.numberOfQuestions / 2);
    
    for (let i = 1; i <= formData.numberOfQuestions; i++) {
      const multiplier = 1 + (i - 1) * 0.3; // 30% increase per question
      newRewards.push({
        questionNumber: i,
        correctReward: Math.floor(baseReward * multiplier)
      });
    }
    setRewards(newRewards);
  }, [formData.numberOfQuestions, formData.totalPrizeAmount]);

  // Adjust questions array when numberOfQuestions changes
  React.useEffect(() => {
    const currentLength = questions.length;
    const targetLength = formData.numberOfQuestions;
    
    if (targetLength > currentLength) {
      const newQuestions = [...questions];
      for (let i = currentLength; i < targetLength; i++) {
        newQuestions.push({ text: '', options: ['', '', '', ''], correctOption: 0, timeLimit: 30 });
      }
      setQuestions(newQuestions);
    } else if (targetLength < currentLength) {
      setQuestions(questions.slice(0, targetLength));
    }
  }, [formData.numberOfQuestions]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const newQuestions = [...questions];
    if (field === 'options') {
      newQuestions[index] = { ...newQuestions[index], options: value };
    } else {
      newQuestions[index] = { ...newQuestions[index], [field]: value };
    }
    setQuestions(newQuestions);
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...questions];
    const options = [...(newQuestions[questionIndex].options || ['', '', '', ''])];
    options[optionIndex] = value;
    newQuestions[questionIndex] = { ...newQuestions[questionIndex], options };
    setQuestions(newQuestions);
  };

  const generateQuestionsWithAI = async () => {
    if (!formData.category) {
      toast({
        title: "Missing Information",
        description: "Please select a category first",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-questions', {
        body: {
          category: formData.category,
          numberOfQuestions: formData.numberOfQuestions
        }
      });

      if (error) throw error;

      if (data?.questions) {
        setQuestions(data.questions);
        toast({
          title: "Hard Questions Generated",
          description: `Successfully generated ${data.questions.length} challenging questions using AI`,
        });
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate questions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleJsonPaste = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const quizzesArray = Array.isArray(parsed) ? parsed : [parsed];
      
      if (quizzesArray.length > 20) {
        toast({
          title: "Too Many Quizzes",
          description: "Maximum 20 quizzes allowed at once",
          variant: "destructive"
        });
        return;
      }

      // Fill form with first quiz data
      const firstQuiz = quizzesArray[0];
      if (firstQuiz) {
        setFormData({
          title: firstQuiz.title || '',
          description: firstQuiz.description || '',
          category: firstQuiz.category || '',
          entryFee: firstQuiz.entryFee || 500,
          totalPrizeAmount: firstQuiz.prizePool || 5000,
          numberOfQuestions: firstQuiz.questions?.length || 5,
          penaltyAmount: firstQuiz.penaltyAmount || 50
        });

        if (firstQuiz.questions) {
          setQuestions(firstQuiz.questions.map((q: any) => ({
            text: q.text || '',
            options: q.options || ['', '', '', ''],
            correctOption: q.correctOption || 0,
            timeLimit: q.timeLimit || 30
          })));
        }
      }

      toast({
        title: "JSON Loaded",
        description: `Loaded ${quizzesArray.length} quiz(zes) from JSON`,
      });
      setJsonInput('');
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please paste valid quiz JSON format",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text || !q.options?.every(opt => opt.trim())) {
        toast({
          title: "Incomplete Questions",
          description: `Please complete question ${i + 1}`,
          variant: "destructive"
        });
        return;
      }
    }

    setIsSaving(true);
    try {
      // Calculate start and end times (start in 1 hour, duration 15 mins)
      const startTime = new Date(Date.now() + 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 15 * 60 * 1000);

      const quizData = {
        title: formData.title,
        description: formData.description,
        entry_fee: formData.entryFee,
        prize_pool: formData.totalPrizeAmount,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration: 15,
        status: 'upcoming',
        is_available: true,
        questions: questions.map((q, idx) => ({
          id: `q${idx + 1}`,
          text: q.text,
          options: q.options,
          correctOption: q.correctOption,
          timeLimit: q.timeLimit
        })) as any,
        reward_progression: rewards as any,
        penalty_amount: formData.penaltyAmount
      };

      if (isEditMode) {
        // Update existing quiz
        const { error } = await supabase
          .from('quizzes')
          .update(quizData)
          .eq('id', quizId);

        if (error) throw error;

        toast({
          title: "Quiz Updated Successfully",
          description: `${formData.title} has been updated`,
        });
      } else {
        // Create new quiz
        const { error } = await supabase
          .from('quizzes')
          .insert([quizData])
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Quiz Created Successfully",
          description: `${formData.title} has been created and is ready for players`,
        });
      }

      navigate('/admin/quizzes');
    } catch (error) {
      console.error('Error saving quiz:', error);
      toast({
        title: isEditMode ? "Update Failed" : "Creation Failed",
        description: `Failed to ${isEditMode ? 'update' : 'create'} quiz. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading quiz data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/quizzes')} className="text-primary-foreground hover:bg-white/20">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold ml-4">{isEditMode ? 'Edit Quiz' : 'Create New Quiz'}</h1>
        </div>
        <p className="text-primary-foreground/80">{isEditMode ? 'Update quiz details and questions' : 'Set up a new quiz with progressive rewards'}</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* JSON Paste Feature */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Fill from JSON</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="jsonInput">Paste Quiz JSON (up to 20 quizzes)</Label>
              <Textarea
                id="jsonInput"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='Paste your quiz JSON here...'
                className="min-h-[100px] font-mono text-sm"
              />
            </div>
            <Button onClick={handleJsonPaste} variant="secondary" className="w-full">
              Load from JSON
            </Button>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Quiz Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Quiz Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter quiz title"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your quiz"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General Knowledge</SelectItem>
                    <SelectItem value="Science">Science</SelectItem>
                    <SelectItem value="History">History</SelectItem>
                    <SelectItem value="Sports">Sports</SelectItem>
                    <SelectItem value="Entertainment">Entertainment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
                <div>
                  <Label htmlFor="penalty">Penalty Amount (₦)</Label>
                  <Input
                    id="penalty"
                    type="number"
                    value={formData.penaltyAmount}
                    onChange={(e) => handleInputChange('penaltyAmount', parseInt(e.target.value))}
                    min="0"
                  />
                </div>
              </div>
          </CardContent>
        </Card>

        {/* Financial Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="entryFee">Entry Fee (₦)</Label>
                <Input
                  id="entryFee"
                  type="number"
                  value={formData.entryFee}
                  onChange={(e) => handleInputChange('entryFee', parseInt(e.target.value))}
                  min="5"
                  placeholder="Minimum ₦5"
                />
              </div>
              
              <div>
                <Label htmlFor="totalPrize">Total Prize Amount (₦)</Label>
                <Input
                  id="totalPrize"
                  type="number"
                  value={formData.totalPrizeAmount}
                  onChange={(e) => handleInputChange('totalPrizeAmount', parseInt(e.target.value))}
                  min="100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="questions">Number of Questions</Label>
                <Input
                  id="questions"
                  type="number"
                  value={formData.numberOfQuestions}
                  onChange={(e) => handleInputChange('numberOfQuestions', parseInt(e.target.value))}
                  min="3"
                  max="20"
                />
              </div>
              
              <div>
                <Label htmlFor="penalty">Penalty per Wrong Answer (₦)</Label>
                <Input
                  id="penalty"
                  type="number"
                  value={formData.penaltyAmount}
                  onChange={(e) => handleInputChange('penaltyAmount', parseInt(e.target.value))}
                  min="10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reward Progression */}
        <Card>
          <CardHeader>
            <CardTitle>Reward Progression</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {rewards.map((reward, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="font-medium">Question {reward.questionNumber}</span>
                  <span className="text-accent font-bold">₦{reward.correctReward.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Questions ({questions.length})</CardTitle>
              <Button 
                onClick={generateQuestionsWithAI}
                disabled={isGenerating || !formData.category}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <MagicWand size={16} />
                {isGenerating ? 'Generating...' : 'Generate Hard Questions'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {questions.map((question, qIndex) => (
              <div key={qIndex} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Question {qIndex + 1}</h4>
                  <div className="text-sm text-muted-foreground">
                    Reward: ₦{rewards[qIndex]?.correctReward.toLocaleString()}
                  </div>
                </div>
                
                <div>
                  <Label>Question Text</Label>
                  <Textarea
                    value={question.text || ''}
                    onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                    placeholder="Enter your question"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Answer Options</Label>
                  {question.options?.map((option, oIndex) => (
                    <div key={oIndex} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name={`correct-${qIndex}`}
                        checked={question.correctOption === oIndex}
                        onChange={() => handleQuestionChange(qIndex, 'correctOption', oIndex)}
                        className="text-primary"
                      />
                      <Input
                        value={option}
                        onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                        className={question.correctOption === oIndex ? 'border-accent' : ''}
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <Label>Time Limit (seconds)</Label>
                  <Input
                    type="number"
                    value={question.timeLimit || 30}
                    onChange={(e) => handleQuestionChange(qIndex, 'timeLimit', parseInt(e.target.value))}
                    min="10"
                    max="120"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex space-x-4">
          <Button variant="outline" onClick={() => navigate('/admin/quizzes')} disabled={isSaving} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving} className="flex-1">
            {isSaving ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Quiz' : 'Create Quiz')}
          </Button>
        </div>
      </div>

      <div className="pb-6"></div>
    </div>
  );
}