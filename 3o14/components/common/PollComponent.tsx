import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { formatDistanceToNow, isPast } from 'date-fns';
import type { Poll } from '@/types/api';

interface PollComponentProps {
  poll: Poll;
  onVote?: (optionIndex: number) => void;
  isOwnPoll?: boolean;
}

export const PollComponent: React.FC<PollComponentProps> = ({ poll, onVote, isOwnPoll = false }) => {
  const theme = useTheme();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');

  const totalVotes = poll?.votes_count || 0;

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
    const timer = setInterval(updateTimeLeft, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [poll.expires_at]);

  const handleVote = async () => {
    if (selectedOption === null || isVoting) return;

    setIsVoting(true);
    try {
      if (onVote) {
        onVote(selectedOption);
      }
    } catch (error) {
      console.error('Failed to vote:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const canVote = !poll?.expired && !isVoting && !isOwnPoll;

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
    },
    optionButtonSelected: {
      borderColor: theme.colors.primary,
    },
    optionButtonUnselected: {
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
    radioButton: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      marginRight: theme.spacing.small,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    radioUnselected: {
      borderColor: theme.colors.border,
      backgroundColor: 'transparent',
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
    pollStatus: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.small,
      fontStyle: 'italic',
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

      <View style={styles.optionsContainer}>
        {poll?.options.map((option, index) => {
          const percentage = totalVotes > 0
            ? Math.round((option.votes_count / totalVotes) * 100)
            : 0;

          return (
            <TouchableOpacity
              key={index}
              onPress={() => canVote && setSelectedOption(index)}
              disabled={!canVote}
              style={[
                styles.optionButton,
                selectedOption === index ? styles.optionButtonSelected : styles.optionButtonUnselected
              ]}
            >
              <View style={[styles.progressBar, { width: `${percentage}%` }]} />

              <View style={styles.optionContent}>
                <View style={styles.optionLeft}>
                  {canVote && (
                    <View style={[
                      styles.radioButton,
                      selectedOption === index ? styles.radioSelected : styles.radioUnselected
                    ]}>
                      {selectedOption === index && (
                        <Ionicons name="checkmark" size={16} color={theme.colors.background} />
                      )}
                    </View>
                  )}
                  <Text style={styles.optionTitle}>
                    {option.title}
                  </Text>
                </View>
                <Text style={styles.percentage}>
                  {percentage}%
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {canVote && (
        <TouchableOpacity
          onPress={handleVote}
          disabled={selectedOption === null || isVoting}
          style={[
            styles.voteButton,
            selectedOption !== null ? styles.voteButtonEnabled : styles.voteButtonDisabled
          ]}
        >
          <Text style={[
            styles.voteButtonText,
            selectedOption !== null ? styles.voteButtonTextEnabled : styles.voteButtonTextDisabled
          ]}>
            {isVoting ? 'Voting...' : 'Submit Vote'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
