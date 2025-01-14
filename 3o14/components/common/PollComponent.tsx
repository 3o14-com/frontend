import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { formatDistanceToNow, isPast } from 'date-fns';
import type { Poll } from '@/types/api';

interface PollComponentProps {
  poll: Poll;
  onVote?: (choices: number[]) => Promise<void>;
  isOwnPoll?: boolean;
  voted?: boolean;
}

export const PollComponent: React.FC<PollComponentProps> = ({
  poll,
  onVote,
  isOwnPoll = false,
  voted = false,
}) => {
  const theme = useTheme();
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [isVoting, setIsVoting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [hasVoted, setHasVoted] = useState(voted);
  const [localPoll, setLocalPoll] = useState<Poll>(poll);

  const totalVotes = localPoll?.votes_count || 0;
  const isMultipleChoice = localPoll.multiple;
  const isReadOnly = hasVoted || localPoll.expired || isOwnPoll;

  useEffect(() => {
    setLocalPoll(poll);
  }, [poll]);

  useEffect(() => {
    setHasVoted(voted);
  }, [voted]);

  useEffect(() => {
    const updateTimeLeft = () => {
      if (!poll.expires_at) return;

      const expiryDate = new Date(poll.expires_at);
      if (isPast(expiryDate)) {
        setTimeLeft('Poll ended');
        return;
      }

      const timeRemaining = formatDistanceToNow(expiryDate, { addSuffix: true });
      setTimeLeft(`Ends ${timeRemaining}`);
    };

    updateTimeLeft();
    const timer = setInterval(updateTimeLeft, 60000);
    return () => clearInterval(timer);
  }, [poll.expires_at]);

  const handleOptionSelect = (index: number) => {
    if (isReadOnly) return;

    setSelectedOptions(prev => {
      if (isMultipleChoice) {
        // For multiple choice: toggle the selected option
        return prev.includes(index)
          ? prev.filter(i => i !== index)
          : [...prev, index];
      } else {
        // For single choice: replace the selection
        return [index];
      }
    });
  };

  const handleVote = async () => {
    if (selectedOptions.length === 0 || isVoting || isReadOnly || !onVote) return;

    setIsVoting(true);
    const originalPoll = { ...localPoll };

    try {
      // Optimistically update UI
      const updatedPoll = { ...localPoll };
      selectedOptions.forEach(index => {
        if (updatedPoll.options[index]) {
          updatedPoll.options[index].votes_count += 1;
        }
      });
      updatedPoll.votes_count += 1;
      setLocalPoll(updatedPoll);

      // Submit the vote
      await onVote(selectedOptions);

      // Mark as voted after successful submission
      setHasVoted(true);
    } catch (error) {
      console.error('Vote submission error:', error);
      // Revert optimistic update on error
      setLocalPoll(originalPoll);
      Alert.alert('Error', 'Failed to submit vote');
    } finally {
      setIsVoting(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      marginTop: theme.spacing.medium,
      padding: theme.spacing.medium,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: theme.borderRadius.medium,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.small,
    },
    headerText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    timeLeft: {
      fontSize: 14,
      color: poll.expired ? theme.colors.error : theme.colors.textSecondary,
      marginTop: 4,
    },
    optionsContainer: {
      gap: theme.spacing.small,
    },
    optionButton: {
      borderRadius: theme.borderRadius.small,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    progressBar: {
      position: 'absolute',
      height: '100%',
      backgroundColor: `${theme.colors.primary}20`,
    },
    optionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.small,
      zIndex: 1,
    },
    optionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    optionTitle: {
      flex: 1,
      color: theme.colors.text,
    },
    percentage: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginLeft: theme.spacing.small,
    },
    voteButton: {
      marginTop: theme.spacing.medium,
      padding: theme.spacing.small,
      borderRadius: theme.borderRadius.small,
      alignItems: 'center',
    },
    voteButtonEnabled: {
      backgroundColor: theme.colors.primary,
    },
    voteButtonDisabled: {
      backgroundColor: theme.colors.border,
    },
    voteButtonText: {
      fontSize: 16,
    },
    voteButtonTextEnabled: {
      color: theme.colors.background,
    },
    voteButtonTextDisabled: {
      color: theme.colors.textSecondary,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.timeLeft}>{timeLeft}</Text>
        </View>
        <Text style={styles.headerText}>
          {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
        </Text>
      </View>

      {isReadOnly && (
        <View style={styles.optionsContainer}>
          {poll?.options.map((option, index) => {

            let percentage: number;
            if (!isMultipleChoice) {
              percentage = totalVotes > 0
                ? Math.round((option.votes_count / totalVotes) * 100)
                : 0;
            } else {
              const maxVotes = Math.max(...poll.options.map(option => option.votes_count));
              percentage = maxVotes > 0
                ? Math.round((option.votes_count / maxVotes) * 100)
                : 0;
            }

            return (
              <View
                key={index}
                style={styles.optionButton}
              >
                <View style={[styles.progressBar, { width: `${percentage}%` }]} />

                <View style={styles.optionContent}>
                  <View style={styles.optionLeft}>
                    <Text style={styles.optionTitle}>
                      {option.title}
                    </Text>
                  </View>
                  <Text style={styles.percentage}>
                    {percentage}%
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {!isReadOnly && (
        <>
          <View style={styles.optionsContainer}>
            {poll?.options.map((option, index) => {
              const isSelected = selectedOptions.includes(index);

              return (
                <TouchableOpacity
                  key={`selection-${index}`}
                  onPress={() => handleOptionSelect(index)}
                  style={[
                    styles.optionButton,
                    isSelected && { borderColor: theme.colors.primary }
                  ]}
                >
                  <View style={styles.optionContent}>
                    <View style={styles.optionLeft}>
                      <View style={[
                        {
                          width: 20,
                          height: 20,
                          borderRadius: isMultipleChoice ? 4 : 10,
                          borderWidth: 2,
                          marginRight: theme.spacing.small,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                          backgroundColor: isSelected ? theme.colors.primary : 'transparent',
                        }
                      ]}>
                        {isSelected && (
                          <Ionicons
                            name={isMultipleChoice ? "checkmark" : "radio-button-on"}
                            size={16}
                            color={theme.colors.background}
                          />
                        )}
                      </View>
                      <Text style={styles.optionTitle}>
                        {option.title}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {!isReadOnly && (
            <TouchableOpacity
              onPress={handleVote}
              disabled={selectedOptions.length === 0 || isVoting}
              style={[
                styles.voteButton,
                selectedOptions.length > 0 ? styles.voteButtonEnabled : styles.voteButtonDisabled
              ]}
            >
              <Text style={[
                styles.voteButtonText,
                selectedOptions.length > 0 ? styles.voteButtonTextEnabled : styles.voteButtonTextDisabled
              ]}>
                {isVoting ? 'Voting...' : 'Submit Vote'}
              </Text>
            </TouchableOpacity>
          )}

        </>
      )}
    </View>
  );
};
