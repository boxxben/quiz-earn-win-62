import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash } from '@phosphor-icons/react';
import { useToast } from '@/hooks/use-toast';
import { Question, QuizReward } from '@/types';

export default function AdminQuizCreate() {
  const { user, hydrated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
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

  const handleSubmit = () => {
    // Check minimum balance (₦5 minimum or admin-defined amount)
    const minimumRequired = Math.max(5, formData.entryFee);
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

    // Create quiz (this would normally send to backend)
    console.log('Creating quiz:', { formData, questions, rewards });
    
    toast({
      title: "Quiz Created Successfully",
      description: `${formData.title} has been created and is ready for players`,
    });

    navigate('/admin/quizzes');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/quizzes')} className="text-primary-foreground hover:bg-white/20">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold ml-4">Create New Quiz</h1>
        </div>
        <p className="text-primary-foreground/80">Set up a new quiz with progressive rewards</p>
      </div>

      <div className="px-6 py-6 space-y-6">
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
            <CardTitle>Questions ({questions.length})</CardTitle>
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
          <Button variant="outline" onClick={() => navigate('/admin/quizzes')} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="flex-1">
            Create Quiz
          </Button>
        </div>
      </div>

      <div className="pb-6"></div>
    </div>
  );
}